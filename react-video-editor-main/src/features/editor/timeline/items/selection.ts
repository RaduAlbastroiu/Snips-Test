import { FabricObject, timeMsToUnits, unitsToTimeMs } from "@designcombo/timeline";
import { IDisplay, ITrackItem } from "@designcombo/types";

interface SelectionProps {
  id: string;
  tScale: number;
  display: IDisplay;
  duration: number;
  label?: string;
}

class SelectionItem extends FabricObject {
  static type = "Selection";
  public selectionLabel: string;
  declare display: IDisplay;
  declare duration: number;
  declare tScale: number;
  declare id: string;

  constructor(props: SelectionProps) {
    super();
    this.id = props.id;
    this.tScale = props.tScale;
    this.display = props.display;
    this.duration = props.duration;
    this.selectionLabel = props.label ?? "Selection";

    this.stroke = "#12B76A";
    this.fill = "rgba(18, 183, 106, 0.18)";
    this.strokeWidth = 2;
    this.rx = 6;
    this.ry = 6;
    this.hasBorders = false;
    this.objectCaching = false;
    this.selectable = true;
  }

  static fromTrackItem(trackItem: ITrackItem, options: { tScale: number }) {
    const display = trackItem.display;
    const duration = unitsToTimeMs(trackItem.display.to - trackItem.display.from, options.tScale, trackItem.playbackRate);
    return new SelectionItem({
      id: trackItem.id,
      tScale: options.tScale,
      display,
      duration,
      label: trackItem.name
    });
  }

  _render(ctx: CanvasRenderingContext2D) {
    const width = timeMsToUnits(this.duration, this.tScale || 1);
    const height = this.height || 30;

    ctx.save();
    ctx.translate(-width / 2, -height / 2);

    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 6);
    ctx.fillStyle = this.fill as string;
    ctx.fill();

    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.stroke as string;
    ctx.stroke();

    ctx.restore();
  }
}

export default SelectionItem;

