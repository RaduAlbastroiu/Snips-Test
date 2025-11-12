import { Router } from "express";
import {
  addEpisodesToSelection,
  createSelection,
  deleteSelection,
  getSelectionById,
  getSelections,
  removeEpisodeFromSelection,
  updateSelectionName,
} from "./service";

const selectionRouter = Router();

selectionRouter.get("/", async (_req, res) => {
  try {
    const selections = await getSelections();
    res.json(selections);
  } catch (error) {
    console.error("Failed to fetch selections:", error);
    res.status(500).json({ error: "Failed to fetch selections" });
  }
});

selectionRouter.get("/:id", async (req, res) => {
  try {
    const selection = await getSelectionById(req.params.id);

    if (!selection) {
      res.status(404).json({ error: "Selection not found" });
      return;
    }

    res.json(selection);
  } catch (error) {
    console.error("Failed to fetch selection:", error);
    res.status(500).json({ error: "Failed to fetch selection" });
  }
});

selectionRouter.post("/", async (req, res) => {
  try {
    const { name, episodes } = req.body ?? {};

    if (!name) {
      res.status(400).json({ error: "Selection name is required" });
      return;
    }

    const selection = await createSelection({
      name,
      episodes: episodes ?? {},
    });

    res.status(201).json(selection);
  } catch (error) {
    console.error("Failed to create selection:", error);
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ error: "Selection name must be unique" });
      return;
    }
    res.status(500).json({ error: "Failed to create selection" });
  }
});

selectionRouter.patch("/:id", async (req, res) => {
  try {
    const { name } = req.body ?? {};

    if (!name) {
      res.status(400).json({
        error: "Selection name is required",
      });
      return;
    }

    const selection = await updateSelectionName(req.params.id, name);

    if (!selection) {
      res.status(404).json({ error: "Selection not found" });
      return;
    }

    res.json(selection);
  } catch (error) {
    console.error("Failed to update selection:", error);
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ error: "Selection name must be unique" });
      return;
    }
    res.status(500).json({ error: "Failed to update selection" });
  }
});

selectionRouter.patch("/:id/addEpisode", async (req, res) => {
  try {
    const episodes = req.body as
      | Record<string, { start: number; end: number }>
      | undefined;

    if (!episodes || Object.keys(episodes).length === 0) {
      res.status(400).json({
        error: "Episode payload is required",
      });
      return;
    }

    const selection = await addEpisodesToSelection(req.params.id, episodes);

    if (!selection) {
      res.status(404).json({ error: "Selection not found" });
      return;
    }

    res.json(selection);
  } catch (error) {
    console.error("Failed to add episode to selection:", error);
    res.status(500).json({ error: "Failed to add episode to selection" });
  }
});

selectionRouter.patch("/:id/removeEpisode", async (req, res) => {
  try {
    const { episodeName } = req.body ?? {};

    if (!episodeName) {
      res.status(400).json({
        error: "Episode name is required",
      });
      return;
    }

    const { selection, removed } = await removeEpisodeFromSelection(
      req.params.id,
      episodeName
    );

    if (!selection) {
      res.status(404).json({ error: "Selection not found" });
      return;
    }

    if (!removed) {
      res.json({
        selection,
        message: `Episode "${episodeName}" was not found in the selection`,
      });
      return;
    }

    res.json(selection);
  } catch (error) {
    console.error("Failed to remove episode from selection:", error);
    res.status(500).json({ error: "Failed to remove episode from selection" });
  }
});

selectionRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteSelection(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: "Selection not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete selection:", error);
    res.status(500).json({ error: "Failed to delete selection" });
  }
});

export { selectionRouter };
