export function QuestionBubble({ text }: { text: string }) {
  return (
    <div className="question">
      <div className="question__bubble">{text}</div>
    </div>
  );
}
