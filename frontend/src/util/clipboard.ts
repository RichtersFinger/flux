/**
 * Reads image files from clipboard as FileList.
 * @param callback Callback handler for extracted FileList.
 */
export async function readImageFilesFromClipboard(
  callback: (fl: FileList) => void,
) {
  const clipboardItems = await navigator.clipboard.read();

  for (const item of clipboardItems) {
    // check for image MIME type
    const imageType = item.types.find((type) => type.startsWith("image/"));

    if (imageType) {
      const blob = await item.getType(imageType);

      // convert blob to file object
      const file = new File([blob], "clipboard-image.png", {
        type: imageType,
      });

      // create FileList using DataTransfer
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      callback(dataTransfer.files);
      // exit on first image
      return;
    }
  }
}
