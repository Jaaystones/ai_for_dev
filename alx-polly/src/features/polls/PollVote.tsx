import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Poll, PollOption } from "@/types/poll";

interface PollVoteProps {
  poll: Poll;
  onVote: (optionId: string) => Promise<void>;
}

export default function PollVote({ poll, onVote }: PollVoteProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optimisticVotes, setOptimisticVotes] = useState<PollOption[]>(poll.options);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (optionId: string) => {
    setIsVoting(true);
    setError(null);
    setSelectedOption(optionId);
    // Optimistically update vote count
    setOptimisticVotes(options =>
      options.map(opt =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      )
    );
    try {
      await onVote(optionId);
    } catch (err) {
      setError("Vote failed. Please try again.");
      // Revert optimistic update
      setOptimisticVotes(poll.options);
      setSelectedOption(null);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="space-y-4">
      {optimisticVotes.map(option => (
        <Button
          key={option.id}
          disabled={isVoting || !!selectedOption}
          onClick={() => handleVote(option.id)}
          className={
            selectedOption === option.id ? "bg-blue-600 text-white" : ""
          }
        >
          {option.text} ({option.votes} votes)
        </Button>
      ))}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
