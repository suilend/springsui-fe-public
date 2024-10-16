import { useState } from "react";

import { ChevronDown, ChevronRight, MessageCircleQuestion } from "lucide-react";

import Popover from "@/components/Popover";
import { AppData, useAppContext } from "@/contexts/AppContext";
import useBreakpoint from "@/hooks/useBreakpoint";
import {
  NORMALIZED_LST_COINTYPE,
  NORMALIZED_SUI_COINTYPE,
} from "@/lib/coinType";

interface QuestionAnswerProps {
  initialIsOpen?: boolean;
  question: string;
  answer: string;
}

function QuestionAnswer({
  initialIsOpen,
  question,
  answer,
}: QuestionAnswerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(!!initialIsOpen);

  return (
    <div
      className="flex w-full cursor-pointer flex-row gap-2"
      onClick={() => setIsOpen((is) => !is)}
    >
      {isOpen ? (
        <ChevronDown className="text-navy-600" size={20} />
      ) : (
        <ChevronRight className="text-navy-600" size={20} />
      )}

      <div className="flex flex-1 flex-col gap-2">
        <p className="text-p2">{question}</p>
        {isOpen && <p className="text-p2 font-normal">{answer}</p>}
      </div>
    </div>
  );
}

export default function FaqPopover() {
  const appContext = useAppContext();
  const appData = appContext.appData as AppData;

  const { md } = useBreakpoint();

  const suiToken = appData.coinMetadataMap[NORMALIZED_SUI_COINTYPE];
  const lstToken = appData.coinMetadataMap[NORMALIZED_LST_COINTYPE];

  const questionsAnswers = [
    {
      question: "What is staking?",
      answer: "Staking is...",
    },
    {
      question: `Where can I use ${lstToken.symbol}?`,
      answer: `${lstToken.symbol} will be deeply integrated throughout the Sui ecosystem. It will be usable across DEXes, lending protocols, stablecoins protocols, NFT marketplaces and more. The goal is to have as many integrations for ${lstToken.symbol} as ${suiToken.symbol} itself!`,
    },
  ];

  return (
    <Popover
      trigger={
        <button className="flex h-10 w-8 flex-row items-center justify-center gap-2 md:h-12 md:w-auto md:rounded-md md:bg-white md:px-4 md:shadow-sm">
          <MessageCircleQuestion size={20} />

          {/* WIDTH >= md */}
          <p className="text-p2 max-md:hidden">FAQ</p>
        </button>
      }
      contentProps={{
        align: md ? "end" : "center",
        maxWidth: 320,
        maxHeight: 400,
      }}
    >
      <div className="flex w-full flex-col gap-3">
        {questionsAnswers.map((qa, index) => (
          <QuestionAnswer
            key={index}
            initialIsOpen={index === 0}
            question={qa.question}
            answer={qa.answer}
          />
        ))}
      </div>
    </Popover>
  );
}
