import {
  IMentionStrategy,
  MentionCategory,
  type Attachments,
  type ImageInfo
} from '@webview/types/chat'
import { removeDuplicates } from '@webview/utils/common'

export class SelectedImagesMentionStrategy implements IMentionStrategy {
  category = MentionCategory.Files as const

  name = 'SelectedImagesMentionStrategy' as const

  async buildNewAttachmentsAfterAddMention(
    data: ImageInfo[],
    currentAttachments: Attachments
  ): Promise<Partial<Attachments>> {
    return {
      fileContext: {
        ...currentAttachments.fileContext,
        selectedImages: removeDuplicates(
          [...(currentAttachments.fileContext?.selectedImages || []), ...data],
          ['url']
        )
      }
    }
  }
}
