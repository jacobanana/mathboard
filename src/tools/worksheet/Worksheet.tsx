// WIDGET COMPONENT — the .iworksheet overlay card.
//
// Renders the header (title, New, Check, settings ✎, ×) and the body rows
// (question label · input · mark). Typed answers, per-question marks and the
// score are EPHEMERAL React state — they are not persisted in v1. The generated
// questions live on the object (store), so "New" writes them back via
// updateObject and they persist/sync.
//
// The WidgetLayer positions and scales this element, so we never set
// left/top/transform here. Header drag moves the object through the store
// (pushHistory once at drag start, then moveObject per pointer move), mirroring
// the prototype's attachDrag.
//
// Ported from buildBody, checkWidget, createWidgetEl and attachDrag
// (maths-whiteboard.html lines 580-593).

import { useEffect, useRef, useState } from "react";
import type { WidgetProps } from "@/tools/registry";
import { useBoardStore } from "@/board/store";
import {
  genQuestions,
  widgetTitle,
  type WorksheetParams,
} from "@/tools/worksheet";

type Mark = { kind: "ok" | "no"; text: string } | null;

export function Worksheet({ obj, onEdit }: WidgetProps<WorksheetParams>) {
  const updateObject = useBoardStore((s) => s.updateObject);
  const moveObject = useBoardStore((s) => s.moveObject);
  const removeObject = useBoardStore((s) => s.removeObject);
  const pushHistory = useBoardStore((s) => s.pushHistory);

  // Ephemeral, not persisted: typed answers, marks and score.
  const [answers, setAnswers] = useState<string[]>(() =>
    obj.questions.map(() => ""),
  );
  const [marks, setMarks] = useState<Mark[]>(() => obj.questions.map(() => null));
  const [score, setScore] = useState("");

  // When the question set changes (New, or a settings edit via the dialog),
  // clear typed answers/marks/score — mirrors the prototype rebuilding the body.
  // moveObject keeps obj.questions identity, so dragging never resets answers.
  useEffect(() => {
    setAnswers(obj.questions.map(() => ""));
    setMarks(obj.questions.map(() => null));
    setScore("");
  }, [obj.questions]);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // --- header drag (pointer events on the head only) ----------------------
  function onHeadPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    const head = e.currentTarget;
    const scale = useBoardStore.getState().camera.scale;
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = obj.x;
    const oy = obj.y;
    pushHistory(); // once at drag start; moveObject pushes no history.
    try {
      head.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const mv = (ev: PointerEvent) => {
      moveObject(obj.id, ox + (ev.clientX - sx) / scale, oy + (ev.clientY - sy) / scale);
    };
    const up = () => {
      head.removeEventListener("pointermove", mv);
      head.removeEventListener("pointerup", up);
    };
    head.addEventListener("pointermove", mv);
    head.addEventListener("pointerup", up);
  }

  // --- check (port of checkWidget) ----------------------------------------
  function check() {
    let correct = 0;
    const next: Mark[] = obj.questions.map((q, i) => {
      const raw = (answers[i] ?? "").trim();
      if (raw === "") return null;
      if (Number(raw) === q.ans) {
        correct++;
        return { kind: "ok", text: "✓" };
      }
      return { kind: "no", text: "✗ " + q.ans };
    });
    setMarks(next);
    setScore(correct + " / " + obj.questions.length + " correct");
  }

  // --- new questions (port of regenWidget — persists via the store) -------
  function regen() {
    const questions = genQuestions(obj);
    updateObject(obj.id, { questions });
    setAnswers(questions.map(() => ""));
    setMarks(questions.map(() => null));
    setScore("");
  }

  function setAnswer(i: number, v: string) {
    setAnswers((prev) => {
      const next = prev.slice();
      next[i] = v;
      return next;
    });
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    e.stopPropagation();
    if (e.key === "Enter") {
      const nextEl = inputs.current[i + 1];
      if (nextEl) nextEl.focus();
      else check();
    }
  }

  return (
    <div className="iworksheet" data-id={obj.id}>
      <div className="iw-head" onPointerDown={onHeadPointerDown}>
        <span className="iw-title">{widgetTitle(obj)}</span>
        <span className="iw-sp" />
        <button className="iw-btn" title="New questions" onClick={regen}>
          New
        </button>
        <button className="iw-btn check" onClick={check}>
          Check
        </button>
        <button
          className="iw-btn"
          title="Settings"
          onClick={() => onEdit?.()}
        >
          ✎
        </button>
        <button
          className="iw-x"
          title="Remove"
          onClick={() => removeObject(obj.id)}
        >
          ×
        </button>
      </div>

      <div className="iw-body">
        {obj.questions.map((q, i) => {
          const mark = marks[i];
          const inOk = mark?.kind === "ok";
          const inNo = mark?.kind === "no";
          return (
            <div className="iw-row" key={i}>
              <span className="iw-q">
                {q.a} {q.op} {q.b} =
              </span>
              <input
                ref={(el) => (inputs.current[i] = el)}
                className={"iw-in" + (inOk ? " ok" : inNo ? " no" : "")}
                inputMode="numeric"
                autoComplete="off"
                value={answers[i] ?? ""}
                onChange={(e) => setAnswer(i, e.target.value)}
                onKeyDown={(e) => onInputKeyDown(e, i)}
              />
              <span
                className={
                  "iw-mark" + (inOk ? " ok" : inNo ? " no" : "")
                }
              >
                {mark?.text ?? ""}
              </span>
            </div>
          );
        })}
        <div className="iw-score">{score}</div>
      </div>
    </div>
  );
}
