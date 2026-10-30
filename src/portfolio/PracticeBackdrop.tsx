import type { CSSProperties } from "react";
import photos from "./practice-backdrop-photos.json";
import "./practice-backdrop.css";

const practiceBackdropStyle = {
  "--practice-background-gap": "0px",
  "--practice-background-overlap": "8px",
  "--practice-background-feather": "5px",
  "--practice-background-blur": "5px",
  "--practice-background-shade": 0.58,
} as CSSProperties;

/** A static decorative mosaic, bounded by the fourth module. */
export function PracticeBackdrop() {
  return (
    <div className="v2-practice-backdrop" aria-hidden="true" style={practiceBackdropStyle}>
      <div className="v2-practice-backdrop-mosaic">
        {Array.from({ length: 4 }, (_, column) => (
          <div className="v2-practice-backdrop-column" key={column}>
            {photos.slice(column * 3, column * 3 + 3).map((photo) => (
              <div className="v2-practice-backdrop-photo" key={photo.file}
                style={{ flexGrow: photo.height / photo.width }}>
                <img src={`${import.meta.env.BASE_URL}media/practice-backdrop/${photo.file}`}
                  alt="" width={photo.width} height={photo.height}
                  loading="lazy" decoding="async" draggable={false} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="v2-practice-backdrop-shade" />
    </div>
  );
}
