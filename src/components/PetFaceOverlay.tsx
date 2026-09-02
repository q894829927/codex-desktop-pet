import type { PetFace, PetMood } from "../hooks/usePetExpression";

type Props = {
  face: PetFace;
  mood: PetMood;
};

export function PetFaceOverlay({ face, mood }: Props) {
  const closeLeft = face === "blink" || face === "wink" || face === "sleepy";
  const closeRight = face === "blink" || face === "sleepy";
  const sleepy = face === "sleepy";

  return (
    <>
      {(closeLeft || closeRight || sleepy) && (
        <svg
          className={`pet-face-overlay face-${face}`}
          viewBox="0 0 1024 1536"
          aria-hidden="true"
        >
          <defs>
            <filter id="pet-skin-soften" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>

          {closeLeft && (
            <g>
              <ellipse
                cx="421"
                cy="450"
                rx="73"
                ry="61"
                transform="rotate(-8 421 450)"
                className="pet-skin-patch"
                filter="url(#pet-skin-soften)"
              />
              <path d="M365 456 C392 425 451 426 478 462" className="pet-eyelid" />
              <path d="M365 456 L351 449" className="pet-eyelash" />
            </g>
          )}

          {closeRight && (
            <g>
              <ellipse
                cx="636"
                cy="486"
                rx="73"
                ry="62"
                transform="rotate(10 636 486)"
                className="pet-skin-patch"
                filter="url(#pet-skin-soften)"
              />
              <path d="M585 492 C612 460 665 462 692 495" className="pet-eyelid" />
              <path d="M692 495 L706 488" className="pet-eyelash" />
            </g>
          )}

          {sleepy && (
            <g>
              <ellipse
                cx="510"
                cy="552"
                rx="53"
                ry="30"
                className="pet-skin-patch"
                filter="url(#pet-skin-soften)"
              />
              <ellipse cx="510" cy="552" rx="18" ry="15" className="pet-yawn-mouth" />
              <ellipse cx="510" cy="554" rx="10" ry="7" className="pet-yawn-highlight" />
            </g>
          )}
        </svg>
      )}

      {mood === "thinking" && <span className="pet-expression-fx fx-thinking">•••</span>}
      {mood === "rest" && <span className="pet-expression-fx fx-sleep">Zzz</span>}
      {mood === "focus" && <span className="pet-expression-fx fx-focus">⌁</span>}
      {(mood === "happy" || mood === "success") && (
        <span className="pet-expression-fx fx-sparkle">✦</span>
      )}
    </>
  );
}
