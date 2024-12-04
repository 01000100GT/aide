import {
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
  type Ref
} from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { cn } from '@webview/utils/common'
import { InView } from 'react-intersection-observer'
import scrollIntoView from 'scroll-into-view-if-needed'

import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

export interface IndexListCategory {
  id: string
  label: string
}

export interface IndexListItem {
  id: string
  categoryId: string
  content: ReactNode
  contentFooter?: ReactNode
}

export interface IndexListCategoryProps {
  category: IndexListCategory
  isSelected: boolean
  onSelect: () => void
}

export interface IndexListItemProps {
  item: IndexListItem
  isSelected: boolean
  onSelect: () => void
}

const DefaultCategory: FC<IndexListCategoryProps> = ({
  category,
  isSelected,
  onSelect
}) => (
  <Button
    onClick={onSelect}
    variant="ghost"
    size="sm"
    className={cn(
      'w-full rounded-md px-2 py-1.5 text-sm transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      isSelected ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
    )}
  >
    {category.label}
  </Button>
)

const DefaultItem: FC<IndexListItemProps> = ({
  item,
  isSelected,
  onSelect
}) => (
  <div className="flex flex-col">
    <div
      onClick={onSelect}
      className={cn(
        'rounded-md transition-colors cursor-pointer',
        'flex items-center justify-between px-2 py-1.5 hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-primary text-primary-foreground'
      )}
    >
      <div>{item.content}</div>
      {isSelected && <CheckIcon className="h-4 w-4 shrink-0 ml-2" />}
    </div>
    {item.contentFooter && <div className="mt-2">{item.contentFooter}</div>}
  </div>
)

export interface IndexListProps {
  ref?: Ref<HTMLDivElement>
  categories: IndexListCategory[]
  items: IndexListItem[]
  className?: string
  sidebarClassName?: string
  contentClassName?: string
  selectedCategoryId?: string
  selectedItemId?: string
  onSelectItem?: (item: IndexListItem, category: IndexListCategory) => void
  renderCategory?: (props: IndexListCategoryProps) => ReactNode
  renderItem?: (props: IndexListItemProps) => ReactNode
  sidebarFooter?: ReactNode
}

export const IndexList: FC<IndexListProps> = ({
  ref,
  categories,
  items,
  className,
  sidebarClassName,
  contentClassName,
  selectedCategoryId,
  selectedItemId,
  onSelectItem,
  renderCategory = props => <DefaultCategory {...props} />,
  renderItem = props => <DefaultItem {...props} />,
  sidebarFooter
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categoryLabelRefs = useRef<Record<string, Element | null>>({})
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [activeCategory, setActiveCategory] = useState<string>(
    selectedCategoryId || categories[0]?.id || ''
  )

  useEffect(() => {
    if (selectedCategoryId) {
      scrollToCategory(selectedCategoryId)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    if (selectedItemId) {
      scrollToItem(selectedItemId)
    }
  }, [selectedItemId])

  const scrollAndSetActiveCategory = (categoryId: string) => {
    scrollToCategory(categoryId)
    scrollToCategoryLabel(categoryId)
  }

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current[categoryId]
    if (element) {
      scrollIntoView(element, {
        scrollMode: 'if-needed',
        block: 'start',
        behavior: 'smooth'
      })
    }
  }

  const scrollToCategoryLabel = (categoryId: string) => {
    const element = categoryLabelRefs.current[categoryId]
    if (element) {
      scrollIntoView(element, {
        scrollMode: 'if-needed',
        block: 'start'
      })
    }
  }

  const scrollToItem = (itemId: string) => {
    const element = itemRefs.current[itemId]
    if (element) {
      scrollIntoView(element, {
        scrollMode: 'if-needed',
        block: 'start'
      })
    }
  }

  const categoryItemsMap = categories.reduce(
    (acc, category) => {
      acc[category.id] = items.filter(item => item.categoryId === category.id)
      return acc
    },
    {} as Record<string, IndexListItem[]>
  )

  const handleItemInView = (inView: boolean, categoryId: string) => {
    if (inView) {
      setActiveCategory(categoryId)
    }
  }

  return (
    <div ref={ref} className={cn('flex w-full h-full', className)}>
      {/* Sidebar */}
      <div
        className={cn(
          'flex flex-col h-full basis-1/3 border-r',
          sidebarClassName
        )}
      >
        {/* Categories */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {categories.map(category => (
              <div
                key={category.id}
                ref={el => {
                  categoryRefs.current[category.id] = el
                }}
              >
                {renderCategory({
                  category,
                  isSelected: category.id === activeCategory,
                  onSelect: () => {
                    scrollAndSetActiveCategory(category.id)
                  }
                })}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {sidebarFooter && (
          <div className="shrink-0 p-2 border-t">{sidebarFooter}</div>
        )}
      </div>

      {/* Content */}
      <ScrollArea
        ref={containerRef}
        className={cn('basis-2/3 p-2', contentClassName)}
      >
        <div>
          {categories.map((category, i) => {
            const categoryItems = categoryItemsMap[category.id]

            return (
              <div
                key={category.id}
                className={cn('space-y-2 py-4', i !== 0 && 'border-t')}
              >
                <InView
                  threshold={0.5}
                  onChange={inView => handleItemInView(inView, category.id)}
                >
                  <h3
                    ref={el => {
                      categoryLabelRefs.current[category.id] = el
                    }}
                    className="text-xl font-semibold"
                  >
                    {category.label}
                  </h3>
                </InView>

                <div className="space-y-2">
                  {categoryItems?.map(item => (
                    <InView
                      key={item.id}
                      threshold={0.5}
                      onChange={inView => handleItemInView(inView, category.id)}
                    >
                      <div
                        ref={el => {
                          itemRefs.current[item.id] = el
                        }}
                      >
                        {renderItem({
                          item,
                          isSelected: item.id === selectedItemId,
                          onSelect: () => onSelectItem?.(item, category)
                        })}
                      </div>
                    </InView>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

IndexList.displayName = 'IndexList'
