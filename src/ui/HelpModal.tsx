// The Quick guide content. Ported verbatim from the prototype help modal
// (lines 608-613). Renders only the card body (<h2>, #help rows, .card-actions)
// — the host wraps it in <Modal>, matching the dialog contract.

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps): JSX.Element {
  return (
    <>
      <h2>Quick guide</h2>
      <div id="help">
        <div className="row">
          <div className="n">1</div>
          <p>
            <b>Whoever is explaining shares their screen</b> on Meet. You share
            to show a method; she opens this on her tablet and shares <i>her</i>{" "}
            screen for her turn.
          </p>
        </div>
        <div className="row">
          <div className="n">2</div>
          <p>
            <b>Draw</b> writes by hand; <b>Text</b> types. The options strip
            changes to match — pen colour &amp; thickness, or colour &amp; text
            size.
          </p>
        </div>
        <div className="row">
          <div className="n">3</div>
          <p>
            <b>Insert</b> adds tools. Methods (times tables, multiplication,
            division) have a <b>“Fill in the answers”</b> tick so you can show a
            worked example or leave it blank to do together.
          </p>
        </div>
        <div className="row">
          <div className="n">4</div>
          <p>
            <b>Select</b> (↖) to move <i>anything</i> — a tool or a hand-drawing.
            Click to grab one, drag empty space to <b>lasso</b> several,
            Shift-click to add or remove, and <b>⌘/Ctrl+A</b> to select all.{" "}
            <b>Edit</b> (or double-click a widget) changes its settings; the{" "}
            <b>×</b> or Delete removes the selection. Zoom with −/+, pinch or
            ⌘/Ctrl+scroll; pan with ✋, two fingers or scroll.
          </p>
        </div>
      </div>
      <div className="card-actions">
        <button
          className="btn primary"
          id="hOk"
          style={{ flex: 1 }}
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </>
  );
}
