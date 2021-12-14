import * as React from 'react';
import { Grouping, Navigation, Startup, Folders, Filter, Searchbox, Sorting, ViewSwitch } from '.';
import { useRecoilState, useResetRecoilState } from 'recoil';
import { CategoryAtom, DashboardViewAtom, SortingAtom, TagAtom } from '../../state';
import { ClearFilters } from './ClearFilters';
import { PhotographIcon } from '@heroicons/react/outline';
import { Pagination } from '../Media/Pagination';
import { ChoiceButton } from '../Buttons/ChoiceButton';
import { Breadcrumb } from './Breadcrumb';
import { MarkdownIcon } from '../Icons/MarkdownIcon';
import { DashboardViewType, PagesApi, Settings } from '@frontmatter/common';
import useExtension from '../../hooks/useExtension';

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
  const resetSorting = useResetRecoilState(SortingAtom);
  const { get } = useExtension();

  const createContent = () => {
    get(PagesApi.create);
  };

  const createByContentType = () => {
    get(PagesApi.createByContentType);
  };

  const createByTemplate = () => {
    get(PagesApi.createByTemplate);
  };

  const updateView = (view: DashboardViewType) => {
    setView(view);
    resetSorting();
  }

  return (
    <div className={`w-full sticky top-0 z-40 bg-gray-100 dark:bg-vulcan-500`}>
      
      <div className={`px-4 bg-gray-50 dark:bg-vulcan-50 border-b-2 border-gray-200 dark:border-vulcan-200`}>
        <div className={`flex items-center justify-start`}>
          <button className={`p-2 flex items-center ${view === "contents" ? "bg-gray-200 dark:bg-vulcan-200" : ""} hover:bg-gray-100 dark:hover:bg-vulcan-100`} onClick={() => updateView(DashboardViewType.Contents)}>
            <MarkdownIcon className={`h-6 w-auto mr-2`} /><span>Contents</span>
          </button>
          <button className={`p-2 flex items-center ${view === "media" ? "bg-gray-200 dark:bg-vulcan-200" : ""} hover:bg-gray-100 dark:hover:bg-vulcan-100`} onClick={() => updateView(DashboardViewType.Media)}>
            <PhotographIcon className={`h-6 w-auto mr-2`} /><span>Media</span>
          </button>
        </div>
      </div>

      {
        view === DashboardViewType.Contents && (
          <>
            <div className={`px-4 mt-3 mb-2 flex items-center justify-between`}>
              <Searchbox />

              <div className={`flex items-center space-x-4`}>
                <Startup settings={settings} />
                
                <ChoiceButton 
                  title={`Create content`} 
                  choices={[{
                    title: `Create by content type`,
                    onClick: createByContentType,
                    disabled: !settings?.initialized
                  }, {
                    title: `Create by template`,
                    onClick: createByTemplate,
                    disabled: !settings?.initialized
                  }]} 
                  onClick={createContent} 
                  disabled={!settings?.initialized} />
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

              <Folders />

              <Filter label={`Tag`} activeItem={crntTag} items={settings?.tags || []} onClick={(value) => setCrntTag(value)} />

              <Filter label={`Category`} activeItem={crntCategory} items={settings?.categories || []} onClick={(value) => setCrntCategory(value)} />

              <Grouping />

              <Sorting view={DashboardViewType.Contents} />
            </div>
          </>
        )
      }

      {
        view === DashboardViewType.Media && (
          <>
            <Pagination />
            <Breadcrumb />
          </>
        )
      }
    </div>
  );
};