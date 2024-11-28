import { ReactNode, useState } from "react";

import { ChevronDown, ChevronUp, MessageCircleQuestion } from "lucide-react";

import Popover from "@/components/Popover";
import useBreakpoint from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

interface QuestionAnswerProps {
  initialIsExpanded?: boolean;
  question: string;
  answer: ReactNode;
}

function QuestionAnswer({
  initialIsExpanded,
  question,
  answer,
}: QuestionAnswerProps) {
  const [isExpanded, setIsExpanded] = useState(initialIsExpanded);

  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        className="group -my-2 flex w-full flex-row items-center gap-2 py-2 text-left"
        onClick={() => setIsExpanded((is) => !is)}
      >
        <p className="flex-1 text-p2 text-navy-600 transition-colors group-hover:text-foreground">
          {question}
        </p>
        <Chevron className="h-4 w-4 text-navy-600 transition-colors group-hover:text-foreground" />
      </button>
      {isExpanded && <p className="text-p2">{answer}</p>}
    </div>
  );
}

export function FaqContent() {
  // https://docs.google.com/document/d/1FFY3n97sQxRqVf_EHzaAqGTIQTIeeqXPp89Rz6WhQ1Q/edit?tab=t.0#heading=h.1cm8t3gdddqh
  // 31 October 4:18pm
  const qas: {
    question: string;
    answer: string | ReactNode;
  }[] = [
    {
      question: "What is sSUI?",
      answer:
        "Spring Staked SUI (sSUI) is the first LST built using the SpringSui Standard.",
    },
    {
      question: "What are Ecosystem LSTs?",
      answer: (
        <>
          Other LSTs created via the SpringSui Standard are operated by
          independent third-party teams rather than Suilend and are referred to
          as Ecosystem LSTs. Launching these Ecosystem LSTs via SpringSui will
          soon become a permissionless process.
          <br />
          <br />
          For example, Mirai Staked SUI (mSUI) is an Ecosystem LST.
        </>
      ),
    },
    {
      question: "What is the SpringSui Standard?",
      answer:
        "SpringSui is an open source LST standard that offers infinite liquidity through instant unstaking, thereby reducing depegging risks. It also enables the creation of custom LSTs.",
    },
    {
      question: "How does it work?",
      answer: (
        <>
          When you stake SUI, you get a token that represents your stake. These
          tokens can lose value (depeg) during market volatility or low
          liquidity, creating risks like liquidations.
          <br />
          <br />
          SIP-33 fixes this by allowing instant redemption of LSTs for Sui,
          ensuring no depegging. sSUI maintains strong liquidity, making it more
          secure than other LSTs.
        </>
      ),
    },
    {
      question: "Why sSUI?",
      answer:
        "The SpringSui Standard offers liquidity through sSUI tokens, allowing users to freely transfer or sell them while still earning staking rewards. Users can also use sSUI in DeFi protocols, maximizing the utility of their staked assets.",
    },
    {
      question: "How long does unstaking take?",
      answer:
        "sSUI can be unstaked instantly for SUI and only requires 1 transaction.",
    },
    {
      question: "How do I collect my yield?",
      answer:
        "sSUI's yield is built into its price. At launch, 1 sSUI equals 1 SUI. As rewards grow, sSUI's value increases (e.g., 1 sSUI = 1.05 SUI), ensuring all holders benefit from the yield, regardless of where the token is stored.",
    },
    {
      question: "How are APRs determined?",
      answer:
        "The APR for sSUI comes mainly from Sui network staking rewards, influenced by factors like total staked SUI, inflation, and validator performance. High-performing validators earn more, while poor ones face penalties. Commission fees from validators and protocol fees from SpringSui Standard LSTs also impact the final APR for sSUI holders.",
    },
    {
      question: "What fees are there?",
      answer: (
        <>
          <span className="font-semibold">Mint Fee</span>: A small fee (e.g.,
          0.10%) charged when minting sSUI by depositing SUI, covering protocol
          operation costs. For instance, minting 1,000 SUI at 10 bps would
          result in a 1 SUI fee.
          <br />
          <br />
          <span className="font-semibold">
            Performance Fee
          </span>: The performance fee is the percentage of staking rewards kept
          as a fee by the LST pool operator or owner. This is deducted on every
          epoch change (~1 day).
          <br />
          <br />
          <span className="font-semibold">
            Redemption Fee
          </span>: A fee (minimum 1 bp) charged when converting sSUI back to
          SUI, covering unstaking costs. Redeeming 1,000 sSUI at 1 bp would
          result in a 0.1 SUI fee.
        </>
      ),
    },
    {
      question: "What are the risks?",
      answer: (
        <>
          <span className="font-semibold">Smart Contract Risk</span>: LSTs like
          sSUI are vulnerable to smart contract exploits, potentially leading to
          loss of funds if hacked. A failure in the unstake mechanism could
          prevent users from redeeming their tokens, causing depegging and a
          loss in value. The SpringSui Standard mitigates this with rigorous
          audits.
          <br />
          <br />
          <span className="font-semibold">
            Validator Risk
          </span>: Rewards depend on validator performance. Poor performance or
          slashing (penalties for misbehavior) can reduce rewards or lead to
          loss of staked assets.
        </>
      ),
    },
  ];

  return qas.map((qa, index) => (
    <QuestionAnswer
      key={index}
      initialIsExpanded={index === 0}
      question={qa.question}
      answer={qa.answer}
    />
  ));
}

export default function FaqPopover() {
  const { md } = useBreakpoint();

  // State
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Popover
      rootProps={{ open: isOpen, onOpenChange: setIsOpen }}
      trigger={
        <button className="group flex h-12 flex-row items-center justify-center rounded-md bg-white px-4 shadow-sm">
          <div className="flex flex-row items-center gap-2">
            <MessageCircleQuestion
              size={20}
              className={cn(
                isOpen
                  ? "text-foreground"
                  : "text-navy-600 transition-colors group-hover:text-foreground",
              )}
            />
            <p
              className={cn(
                "!text-p2",
                isOpen
                  ? "text-foreground"
                  : "text-navy-600 transition-colors group-hover:text-foreground",
              )}
            >
              FAQ
            </p>
          </div>
        </button>
      }
      contentProps={{
        align: md ? "end" : "center",
        maxWidth: 360,
        maxHeight: 480,
      }}
    >
      <div className="flex w-full flex-col gap-4">
        <FaqContent />
      </div>
    </Popover>
  );
}
