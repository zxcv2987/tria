import type { AnalysisResult as AnalysisResultType } from "@tria/analysis";
import { ResultBadge } from "@/components/status-badges";
import {
  bodyTextClass,
  cardClass,
  codeChipClass,
  helpTextClass,
  metaLabelClass,
  mutedTextClass,
} from "@/components/ui/styles";

type AnalysisResultProps = {
  result: AnalysisResultType;
};

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className={`${cardClass} flex w-full flex-col gap-5`}>
      <ResultBadge result={result.result} />

      <p className={bodyTextClass}>{result.summary}</p>

      {result.suspectedArea && (
        <p className={helpTextClass}>의심 영역: {result.suspectedArea}</p>
      )}

      {result.evidence.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className={metaLabelClass}>관련 파일</h3>
          <ul className="flex flex-col gap-3">
            {result.evidence.map((e) => (
              <li key={e.path}>
                <code className={codeChipClass}>
                  {e.path}
                  {e.symbol ? ` · ${e.symbol}` : ""}
                </code>
                <p className={`mt-1.5 ${mutedTextClass}`}>{e.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.externalChecks.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className={metaLabelClass}>다음 확인 항목</h3>
          <ul className={`list-disc pl-5 ${mutedTextClass}`}>
            {result.externalChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {result.missingInformation.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className={metaLabelClass}>부족한 정보</h3>
          <ul className={`list-disc pl-5 ${mutedTextClass}`}>
            {result.missingInformation.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {result.limitations.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <h3 className={metaLabelClass}>분석 한계</h3>
          <ul className={helpTextClass}>
            {result.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
