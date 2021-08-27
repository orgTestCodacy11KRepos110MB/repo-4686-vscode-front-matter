import { SETTINGS_CONTENT_STATIC_FOLDERS, SETTING_DATE_FIELD, SETTING_SEO_DESCRIPTION_FIELD, SETTINGS_DASHBOARD_OPENONSTART } from './../constants/settings';
import { ArticleHelper } from './../helpers/ArticleHelper';
import { join } from "path";
import { commands, Uri, ViewColumn, Webview, WebviewPanel, window, workspace } from "vscode";
import { SettingsHelper } from '../helpers';
import { TaxonomyType } from '../models';
import { Folders } from './Folders';
import { getNonce } from '../helpers/getNonce';
import { DashboardCommand } from '../pagesView/DashboardCommand';
import { DashboardMessage } from '../pagesView/DashboardMessage';
import { Page } from '../pagesView/models/Page';
import { openFileInEditor } from '../helpers/openFileInEditor';
import { COMMAND_NAME } from '../constants/Extension';
import { Template } from './Template';
import { Notifications } from '../helpers/Notifications';
import { Settings } from '../pagesView/models/Settings';
import { Extension } from '../helpers/Extension';


export class Dashboard {
  private static webview: WebviewPanel | null = null;
  private static isDisposed: boolean = true;

  /** 
   * Init the dashboard
   */
  public static async init(extensionPath: string) {
    const config = SettingsHelper.getConfig();
    const openOnStartup = config.get(SETTINGS_DASHBOARD_OPENONSTART);
    if (openOnStartup) {
      Dashboard.open(extensionPath);
    }
  }

  /**
   * Open or reveal the dashboard
   */
  public static async open(extensionPath: string) {
    if (Dashboard.isOpen) {
			Dashboard.reveal();
		} else {
			Dashboard.create(extensionPath);
		}
  }

  /**
   * Check if the dashboard is still open
   */
  public static get isOpen(): boolean {
    return !Dashboard.isDisposed;
  }

  /**
   * Reveal the dashboard if it is open
   */
  public static reveal() {
    if (Dashboard.webview) {
      Dashboard.webview.reveal();
    }
  }
  
  /**
   * Create the dashboard webview
   */
  public static async create(extensionPath: string) {

    // Create the preview webview
    Dashboard.webview = window.createWebviewPanel(
      'frontMatterDashboard',
      'FrontMatter Dashboard',
      ViewColumn.One,
      {
        enableScripts: true
      }
    );

    Dashboard.isDisposed = false;

    Dashboard.webview.iconPath = {
      dark: Uri.file(join(extensionPath, 'assets/frontmatter-dark.svg')),
      light: Uri.file(join(extensionPath, 'assets/frontmatter.svg'))
    };

    Dashboard.webview.webview.html = Dashboard.getWebviewContent(Dashboard.webview.webview, Uri.parse(extensionPath));

    Dashboard.webview.onDidChangeViewState(() => {
      if (this.webview?.visible) {
        console.log(`Dashboard opened`);
      }
    });

    Dashboard.webview.onDidDispose(() => {
      Dashboard.isDisposed = true;
    });

    workspace.onDidChangeConfiguration(() => {
      Dashboard.getSettings();
    });

    Dashboard.webview.webview.onDidReceiveMessage(async (msg) => {
      switch(msg.command) {
        case DashboardMessage.getData:
          Dashboard.getSettings();
          Dashboard.getPages();
          break;
        case DashboardMessage.openFile:
          openFileInEditor(msg.data);
          break;
        case DashboardMessage.createContent:
          await commands.executeCommand(COMMAND_NAME.createContent);
          break;
        case DashboardMessage.updateSetting:
          Dashboard.updateSetting(msg.data);
          break;
        case DashboardMessage.InitializeProject:
          await commands.executeCommand(COMMAND_NAME.init);
          // Delay to allow the project to be initialized
          setTimeout(() => {
            Dashboard.getSettings();
          }, 1000);
          break;
        case DashboardMessage.Reload:
          Dashboard.webview?.dispose();
          setTimeout(() => {
            Dashboard.open(Extension.getInstance().extensionPath);
          }, 100);
          break;
      }
    });
  }

  /**
   * Retrieve the settings for the dashboard
   */
  private static async getSettings() { 
    Dashboard.postWebviewMessage({
      command: DashboardCommand.settings,
      data: {
        folders: Folders.get(),
        initialized: await Template.isInitialized(),
        tags: SettingsHelper.getTaxonomy(TaxonomyType.Tag),
        categories: SettingsHelper.getTaxonomy(TaxonomyType.Category),
        openOnStart: SettingsHelper.getConfig().get(SETTINGS_DASHBOARD_OPENONSTART),
        versionInfo: Extension.getInstance().getVersion()
      } as Settings
    });
  }

  /**
   * Update a setting from the dashboard
   */
  private static async updateSetting(data: { name: string, value: any }) {
    await SettingsHelper.updateSetting(data.name, data.value);
    Dashboard.getSettings();
  }

  /**
   * Retrieve all the markdown pages
   */
  private static async getPages() {
    const config = SettingsHelper.getConfig();
    const wsFolders = workspace.workspaceFolders;
    const crntWsFolder = wsFolders && wsFolders.length > 0 ? wsFolders[0] : null;

    const descriptionField = config.get(SETTING_SEO_DESCRIPTION_FIELD) as string || "description";
    const dateField = config.get(SETTING_DATE_FIELD) as string || "date";
    const staticFolder = config.get<string>(SETTINGS_CONTENT_STATIC_FOLDERS);

    const folderInfo = await Folders.getInfo();
    const pages: Page[] = [];

    if (folderInfo) {
      for (const folder of folderInfo) {
        for (const file of folder.lastModified) {
          if (file.fileName.endsWith(`.md`) || file.fileName.endsWith(`.mdx`)) {
            try {
              const article = ArticleHelper.getFrontMatterByPath(file.filePath);

              if (article?.data.title) {
                const page: Page = {
                  ...article.data,
                  // FrontMatter properties
                  fmGroup: folder.title,
                  fmModified: file.mtime,
                  fmFilePath: file.filePath,
                  fmFileName: file.fileName,
                  // Make sure these are always set
                  title: article?.data.title,
                  slug: article?.data.slug,
                  date: article?.data[dateField] || "",
                  draft: article?.data.draft,
                  description: article?.data[descriptionField] || "",
                };
      
                if (article?.data.preview && crntWsFolder) {
                  const previewPath = join(crntWsFolder.uri.fsPath, staticFolder || "", article?.data.preview);
                  const previewUri = Uri.file(previewPath);
                  const preview = Dashboard.webview?.webview.asWebviewUri(previewUri);
                  page.preview = preview?.toString() || "";
                }
      
                pages.push(page);
              }
            } catch (error) {
              Notifications.error(`File error: ${file.filePath} - ${error?.message || error}`);
            }
          }
        }
      }
    }

    Dashboard.postWebviewMessage({
      command: DashboardCommand.pages,
      data: pages
    });
  }

  /**
   * Post data to the dashboard
   * @param msg 
   */
  private static postWebviewMessage(msg: { command: DashboardCommand, data?: any }) {
    Dashboard.webview?.webview.postMessage(msg);
  }
  
  /**
   * Retrieve the webview HTML contents
   * @param webView 
   */
  private static getWebviewContent(webView: Webview, extensionPath: Uri): string {
    const scriptUri = webView.asWebviewUri(Uri.joinPath(extensionPath, 'dist', 'pages.js'));

    const nonce = getNonce();

    const version = Extension.getInstance().getVersion();

    return `
      <!DOCTYPE html>
      <html lang="en" style="width:100%;height:100%;margin:0;padding:0;">
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${`vscode-file://vscode-app`} ${webView.cspSource} https://api.visitorbadge.io 'self' 'unsafe-inline'; script-src 'nonce-${nonce}'; style-src ${webView.cspSource} 'self' 'unsafe-inline'; font-src ${webView.cspSource}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Front Matter Dashboard</title>
      </head>
      <body style="width:100%;height:100%;margin:0;padding:0;overflow:hidden" class="bg-gray-100 text-vulcan-500 dark:bg-vulcan-500 dark:text-whisper-500">
        <div id="app" style="width:100%;height:100%;margin:0;padding:0;" ${version.usedVersion ? "" : `data-showWelcome="true"`}></div>

        <img style="display:none" src="https://api.visitorbadge.io/api/combined?user=estruyf&repo=frontmatter-usage&countColor=%23263759" alt="Daily usage" />

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
}