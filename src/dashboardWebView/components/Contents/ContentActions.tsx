import { Messenger } from '@estruyf/vscode/dist/client';
import { Menu } from '@headlessui/react';
import { EyeIcon, TerminalIcon, TrashIcon } from '@heroicons/react/outline';
import * as React from 'react';
import { CustomScript, ScriptType } from '../../../models';
import { DashboardMessage } from '../../DashboardMessage';
import { MenuItem, MenuItems, ActionMenuButton, QuickAction } from '../Menu';
import { Alert } from '../Modals/Alert';

export interface IContentActionsProps {
  title: string;
  path: string;
  scripts: CustomScript[] | undefined;
  onOpen: () => void;
}

export const ContentActions: React.FunctionComponent<IContentActionsProps> = ({ title, path, scripts, onOpen }: React.PropsWithChildren<IContentActionsProps>) => {
  const [ showDeletionAlert, setShowDeletionAlert ] = React.useState(false);
  
  const onView = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpen();
  };
  
  const onDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowDeletionAlert(true);
  };

  const onDeleteConfirm = () => {
    if (path) {
      Messenger.send(DashboardMessage.deleteFile, path);
    }
    setShowDeletionAlert(false);
  }

  const runCustomScript = React.useCallback((e: React.MouseEvent<HTMLButtonElement>, script: CustomScript) => {
    e.stopPropagation();
    Messenger.send(DashboardMessage.runCustomScript, {script, path});
  }, [path]);

  const customScriptActions = React.useMemo(() => {
    return (scripts || []).filter(script => (script.type === undefined || script.type === ScriptType.Content) && !script.bulk).map(script => (
      <MenuItem 
        key={script.title}
        title={<div className='flex items-center'><TerminalIcon className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden={true} /> <span>{script.title}</span></div>} 
        onClick={(value, e) => runCustomScript(e, script)} />
    ))
  }, [scripts]);
  
  return (
    <>
      <div className={`group-scope absolute top-6 right-0 flex flex-col space-y-4`}>       
        <div className="flex items-center border border-transparent group-scope-hover:bg-gray-200 dark:group-scope-hover:bg-vulcan-200 group-scope-hover:border-gray-100 dark:group-scope-hover:border-vulcan-50 rounded-full p-2 -mt-4">
          
          <Menu as="div" className="relative z-10 flex text-left">
            <div className='hidden group-scope-hover:flex'>
              <QuickAction 
                title={`View content`}
                onClick={onView}>
                <EyeIcon className={`w-4 h-4`} aria-hidden="true" />
              </QuickAction>
              
              <QuickAction 
                title={`Delete content`}
                onClick={onDelete}>
                <TrashIcon className={`w-4 h-4`} aria-hidden="true" />
              </QuickAction>
            </div>

            <ActionMenuButton title={`Menu`} />

            <MenuItems widthClass='w-44' marginTopClass='mt-6'>
              <MenuItem 
                title={<div className='flex items-center'><EyeIcon className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden={true} /> <span>View</span></div>}
                onClick={(value, e) => onView(e)} />

              { customScriptActions }

              <MenuItem 
                title={<div className='flex items-center'><TrashIcon className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden={true} /> <span>Delete</span></div>}
                onClick={(value, e) => onDelete(e)} />
            </MenuItems>
          </Menu>
        </div>
      </div>


      {
        showDeletionAlert && (
          <Alert 
            title={`Delete: ${title}`}
            description={`Are you sure you want to delete the "${title}" content?`}
            okBtnText={`Delete`}
            cancelBtnText={`Cancel`}
            dismiss={() => setShowDeletionAlert(false)}
            trigger={onDeleteConfirm} />
        )
      }
    </>
  );
};