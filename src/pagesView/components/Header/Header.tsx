import * as React from 'react';
import { Sorting } from './Sorting';
import { Searchbox } from './Searchbox';
import { Filter } from './Filter';
import { Folders } from './Folders';
import { Settings } from '../../models';
import { DashboardMessage } from '../../DashboardMessage';
import { Startup } from '../Startup';
import { Button } from '../Button';
import { Navigation } from '../Navigation';
import { Grouping } from '.';
import { ViewSwitch } from './ViewSwitch';
import { useRecoilState } from 'recoil';
import { CategoryAtom, DashboardViewAtom, TagAtom } from '../../state';
import { Messenger } from '@estruyf/vscode/dist/client';
import { ClearFilters } from './ClearFilters';
import { MarkdownIcon } from '../../../viewpanel/components/Icons/MarkdownIcon';
import { PhotographIcon } from '@heroicons/react/outline';

export interface IHeaderProps {
  settings: Settings | null;
  
  // Navigation
  totalPages?: number;

  // Page folders
  folders?: string[];
}

export const Header: React.FunctionComponent<IHeaderProps> = ({totalPages, folders, settings }: React.PropsWithChildren<IHeaderProps>) => {
  const [ crntTag, setCrntTag ] = useRecoilState(TagAtom);
  const [ crntCategory, setCrntCategory ] = useRecoilState(CategoryAtom);
  const [ view, setView ] = useRecoilState(DashboardViewAtom);

  const createContent = () => {
    Messenger.send(DashboardMessage.createContent);
  };

  return (
    <div className={`w-full max-w-7xl mx-auto sticky top-0 z-40 bg-gray-100 dark:bg-vulcan-500`}>
      
      <div className={`px-4 bg-vulcan-50 border-b-2 border-gray-300 dark:border-vulcan-200`}>
        <div className={`py-2 flex items-center justify-start space-x-6 xl:space-x-8`}>
          <button className={`flex items-center hover:text-teal-900 ${view === "contents" ? "font-bold" : ""}`} onClick={() => setView("contents")}>
            <MarkdownIcon className={`h-6 w-auto mr-2`} /><span>Contents</span>
          </button>
          <button className={`flex items-center hover:text-teal-900 ${view === "media" ? "font-bold" : ""}`} onClick={() => setView("media")}>
            <PhotographIcon className={`h-5 w-auto mr-2`} /><span>Media</span>
          </button>
        </div>
      </div>

      {
        view === "contents" && (
          <>
            <div className={`px-4 my-2 flex items-center justify-between`}>
              <Searchbox />

              <div className={`flex items-center space-x-4`}>
                <Startup settings={settings} />
                
                <Button onClick={createContent} disabled={!settings?.initialized}>Create content</Button>
              </div>
            </div>

            <div className="px-4 flex flex-row items-center border-b border-gray-200  dark:border-vulcan-100 justify-between">
              <div>
                <Navigation totalPages={totalPages || 0} />
              </div>

              <div>
                <ViewSwitch />
              </div>
            </div>

            <div className={`py-4 px-5 w-full flex items-center justify-between lg:justify-end space-x-4 lg:space-x-6 xl:space-x-8 bg-gray-200 border-b border-gray-300 dark:bg-vulcan-400  dark:border-vulcan-100`}>
              <ClearFilters />

              <Folders folders={folders || []} />

              <Filter label={`Tag`} activeItem={crntTag} items={settings?.tags || []} onClick={(value) => setCrntTag(value)} />

              <Filter label={`Category`} activeItem={crntCategory} items={settings?.categories || []} onClick={(value) => setCrntCategory(value)} />

              <Grouping />

              <Sorting />
            </div>
          </>
        )
      }
    </div>
  );
};