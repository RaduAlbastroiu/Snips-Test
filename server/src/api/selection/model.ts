import { Document, Schema, model, models } from "mongoose";

export interface EpisodeRange {
  start: number;
  end: number;
}

export interface Selection {
  name: string;
  episodes: Record<string, EpisodeRange>;
}

export interface SelectionDocument extends Document {
  name: string;
  episodes: Map<string, EpisodeRange>;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeRangeSchema = new Schema<EpisodeRange>(
  {
    start: { type: Number, required: true, min: 0 },
    end: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SelectionSchema = new Schema<SelectionDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    episodes: {
      type: Map,
      of: EpisodeRangeSchema,
      default: () => new Map<string, EpisodeRange>(),
    },
  },
  { timestamps: true }
);

export const SelectionModel =
  models.Selection || model<SelectionDocument>("Selection", SelectionSchema);
