import {
  EpisodeRange,
  Selection,
  SelectionDocument,
  SelectionModel,
} from "./model";

export async function getSelections(): Promise<SelectionDocument[]> {
  return SelectionModel.find();
}

export async function getSelectionById(
  id: string
): Promise<SelectionDocument | null> {
  return SelectionModel.findById(id);
}

export async function createSelection(
  input: Selection
): Promise<SelectionDocument> {
  const selection = new SelectionModel({
    ...input,
    episodes: new Map(Object.entries(input.episodes ?? {})),
  });
  return selection.save();
}

export async function updateSelectionName(
  id: string,
  name: string
): Promise<SelectionDocument | null> {
  const selection = await SelectionModel.findById(id);

  if (!selection) {
    return null;
  }

  selection.name = name;

  await selection.save();
  return selection;
}

export async function addEpisodesToSelection(
  id: string,
  episodes: Record<string, EpisodeRange>
): Promise<SelectionDocument | null> {
  const selection = await SelectionModel.findById(id);

  if (!selection) {
    return null;
  }

  Object.entries(episodes).forEach(([episodeName, episodeRange]) => {
    selection.episodes.set(episodeName, episodeRange);
  });

  await selection.save();
  return selection;
}

export async function removeEpisodeFromSelection(
  id: string,
  episodeName: string
): Promise<{ selection: SelectionDocument | null; removed: boolean }> {
  const selection = await SelectionModel.findById(id);

  if (!selection) {
    return { selection: null, removed: false };
  }

  const removed = selection.episodes.delete(episodeName);
  if (removed) {
    await selection.save();
  }

  return { selection, removed };
}

export async function deleteSelection(id: string): Promise<boolean> {
  const result = await SelectionModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
