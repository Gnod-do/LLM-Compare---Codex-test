import type { Turn } from '../state/reducer';
import { winners } from '../state/reducer';
import { QuestionBubble } from './QuestionBubble';
import { AnswerCell } from './AnswerCell';

type Props = { turn: Turn; columns: string[]; onRetry: (turnId: string, modelId: string) => void };

export function TurnRow({ turn, columns, onRetry }: Props) {
  const best = winners(turn);
  return (
    <section className="turn">
      <QuestionBubble text={turn.question} />
      <div className="turn__answers" style={{ ['--cols' as string]: columns.length }}>
        {columns.map((id) => (
          <div className="turn__cell" key={id}>
            {turn.answers[id] ? (
              <AnswerCell
                answer={turn.answers[id]}
                onRetry={() => onRetry(turn.id, id)}
                isFastest={best.fastest === id}
                isCheapest={best.cheapest === id}
              />
            ) : (
              <div className="answer__status">—</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
