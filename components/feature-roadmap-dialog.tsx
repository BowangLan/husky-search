"use client"

import * as React from "react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import {
  Check,
  CheckCircle2,
  Lightbulb,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FeatureRoadmapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeatureRoadmapDialog({
  open,
  onOpenChange,
}: FeatureRoadmapDialogProps) {
  const { isSignedIn } = useUser()
  const features = useQuery(api.features.listFeatures)
  const userVotes = useQuery(api.features.getUserVotes)
  const voteCounts = useQuery(api.features.getFeatureVoteCounts)
  const voteOnFeature = useMutation(api.features.voteOnFeature)
  const removeVote = useMutation(api.features.removeVote)
  const suggestFeature = useMutation(api.features.suggestFeature)

  const [suggestionStep, setSuggestionStep] = React.useState<
    "closed" | "form" | "success" | "error"
  >("closed")
  const [suggestionName, setSuggestionName] = React.useState("")
  const [suggestionDescription, setSuggestionDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [suggestionError, setSuggestionError] = React.useState<string | null>(
    null
  )

  const [votePendingByFeatureId, setVotePendingByFeatureId] = React.useState<
    Record<string, "up" | "down" | null>
  >({})
  const [voteFlashByFeatureId, setVoteFlashByFeatureId] = React.useState<
    Record<string, "up" | "down" | "removed-up" | "removed-down" | null>
  >({})
  const voteFlashTimeoutsRef = React.useRef<Record<string, number>>({})

  React.useEffect(() => {
    // Reset suggestion state when dialog closes
    if (!open) {
      setSuggestionStep("closed")
      setSuggestionName("")
      setSuggestionDescription("")
      setSuggestionError(null)
      setIsSubmitting(false)
      setVotePendingByFeatureId({})
      setVoteFlashByFeatureId({})
      for (const timeoutId of Object.values(voteFlashTimeoutsRef.current)) {
        window.clearTimeout(timeoutId)
      }
      voteFlashTimeoutsRef.current = {}
    }
  }, [open])

  const userVotesMap = React.useMemo(() => {
    if (!userVotes) return new Map()
    return new Map(userVotes.map((vote) => [vote.featureId, vote.vote]))
  }, [userVotes])

  const handleVote = async (featureId: Id<"features">, vote: "up" | "down") => {
    const featureIdKey = String(featureId)
    if (votePendingByFeatureId[featureIdKey]) return

    try {
      setVotePendingByFeatureId((prev) => ({ ...prev, [featureIdKey]: vote }))
      const currentVote = userVotesMap.get(featureId)
      if (currentVote === vote) {
        await removeVote({ featureId })
        setVoteFlashByFeatureId((prev) => ({
          ...prev,
          [featureIdKey]: vote === "up" ? "removed-up" : "removed-down",
        }))
      } else {
        await voteOnFeature({ featureId, vote })
        setVoteFlashByFeatureId((prev) => ({ ...prev, [featureIdKey]: vote }))
      }

      const existingTimeoutId = voteFlashTimeoutsRef.current[featureIdKey]
      if (existingTimeoutId) window.clearTimeout(existingTimeoutId)
      voteFlashTimeoutsRef.current[featureIdKey] = window.setTimeout(() => {
        setVoteFlashByFeatureId((prev) => ({ ...prev, [featureIdKey]: null }))
        delete voteFlashTimeoutsRef.current[featureIdKey]
      }, 1200)
    } catch (error) {
      console.error("Failed to vote:", error)
      const message = error instanceof Error ? error.message : "Failed to vote"
      toast.error("Couldn’t save your vote", {
        description:
          message === "User must be authenticated to vote"
            ? "Please sign in and try again."
            : message,
      })
    } finally {
      setVotePendingByFeatureId((prev) => ({ ...prev, [featureIdKey]: null }))
    }
  }

  const handleSuggestFeature = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = suggestionName.trim()
    const description = suggestionDescription.trim()

    if (!name || !description) {
      toast.error("Please fill in both fields", {
        description:
          "Add a name + a short description so we can understand it.",
      })
      return
    }

    setIsSubmitting(true)
    setSuggestionError(null)
    try {
      await suggestFeature({
        name,
        description,
      })
      setSuggestionStep("success")
      setSuggestionName("")
      setSuggestionDescription("")

      setTimeout(() => {
        setSuggestionStep("closed")
      }, 1500)
    } catch (error) {
      console.error("Failed to suggest feature:", error)
      const message =
        error instanceof Error ? error.message : "Failed to submit suggestion"
      setSuggestionError(message)
      toast.error("Couldn’t submit your suggestion", {
        description:
          message === "User must be authenticated to suggest features"
            ? "Please sign in and try again."
            : message,
      })
      setSuggestionStep("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading =
    features === undefined ||
    userVotes === undefined ||
    voteCounts === undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl sm:min-h-[60vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>Feature Roadmap</DialogTitle>
          <DialogDescription>
            Vote on upcoming features or suggest your own ideas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 mt-2 flex flex-col">
          {/* Features List */}
          <div className="space-y-3 flex-1 overflow-y-auto flex max-h-[50vh] flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : features && features.length > 0 ? (
              features.map((feature) => {
                const currentVote = userVotesMap.get(feature._id)
                const featureIdKey = String(feature._id)
                const pendingVote = votePendingByFeatureId[featureIdKey]
                const flash = voteFlashByFeatureId[featureIdKey]
                const isVoting = Boolean(pendingVote)

                return (
                  <div
                    key={feature._id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{feature.name}</h4>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            feature.status === "released" &&
                              "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                            feature.status === "in-development" &&
                              "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                            feature.status === "in-consideration" &&
                              "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          )}
                        >
                          {feature.status === "released" && "Released"}
                          {feature.status === "in-development" &&
                            "In Development"}
                          {feature.status === "in-consideration" &&
                            "In Consideration"}
                        </span>
                      </div>
                      <p className="text-sm font-normal text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    {isSignedIn && (
                      <div className="flex items-center gap-2 pt-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={
                                  currentVote === "up"
                                    ? "Remove upvote"
                                    : "I like this"
                                }
                                className={cn(
                                  "size-8 p-0",
                                  currentVote === "up" &&
                                    "text-green-600 bg-green-50 dark:bg-green-950"
                                )}
                                disabled={isVoting}
                                onClick={() => handleVote(feature._id, "up")}
                              >
                                <AnimatePresence mode="wait" initial={false}>
                                  {pendingVote === "up" ? (
                                    <motion.div
                                      key="up-loading"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{
                                        duration: 0.15,
                                        ease: [0.4, 0.0, 0.2, 1],
                                      }}
                                    >
                                      <Loader2 className="size-4 animate-spin" />
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="up-icon"
                                      animate={{
                                        scale:
                                          flash === "up"
                                            ? [1.06, 1.22, 1.06]
                                            : flash === "removed-up"
                                            ? [1.06, 0.92, 1]
                                            : currentVote === "up"
                                            ? 1.06
                                            : 1,
                                        y:
                                          flash === "up"
                                            ? [0, -2, 0]
                                            : flash === "removed-up"
                                            ? [0, 1, 0]
                                            : 0,
                                      }}
                                      transition={{
                                        duration: 0.15,
                                        ease: [0.4, 0.0, 0.2, 1],
                                      }}
                                    >
                                      <ThumbsUp className="size-4" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {currentVote === "up"
                              ? "Remove upvote"
                              : "I like this"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={
                                  currentVote === "down"
                                    ? "Remove downvote"
                                    : "I don't like this"
                                }
                                className={cn(
                                  "size-8 p-0",
                                  currentVote === "down" &&
                                    "text-red-600 bg-red-50 dark:bg-red-950"
                                )}
                                disabled={isVoting}
                                onClick={() => handleVote(feature._id, "down")}
                              >
                                <AnimatePresence mode="wait" initial={false}>
                                  {pendingVote === "down" ? (
                                    <motion.div
                                      key="down-loading"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.9 }}
                                      transition={{
                                        duration: 0.15,
                                        ease: [0.4, 0.0, 0.2, 1],
                                      }}
                                    >
                                      <Loader2 className="size-4 animate-spin" />
                                    </motion.div>
                                  ) : (
                                    <motion.div
                                      key="down-icon"
                                      animate={{
                                        scale:
                                          flash === "down"
                                            ? [1.06, 1.22, 1.06]
                                            : flash === "removed-down"
                                            ? [1.06, 0.92, 1]
                                            : currentVote === "down"
                                            ? 1.06
                                            : 1,
                                        y:
                                          flash === "down"
                                            ? [0, -2, 0]
                                            : flash === "removed-down"
                                            ? [0, 1, 0]
                                            : 0,
                                      }}
                                      transition={{
                                        duration: 0.15,
                                        ease: [0.4, 0.0, 0.2, 1],
                                      }}
                                    >
                                      <ThumbsDown className="size-4" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8}>
                            {currentVote === "down"
                              ? "Remove downvote"
                              : "I don't like this"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No features in the roadmap yet
              </div>
            )}
          </div>

          {/* Suggestion Section */}
          {isSignedIn && (
            <div className="pt-4 flex-none">
              <AnimatePresence mode="wait" initial={false}>
                {suggestionStep === "closed" && (
                  <motion.div
                    key="suggestion-cta"
                    initial={{ opacity: 0, y: 8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(10px)" }}
                    transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                  >
                    <Button
                      onClick={() => setSuggestionStep("form")}
                      variant="outline"
                      className="w-full"
                    >
                      <Lightbulb className="size-4 mr-2" />
                      Suggest a Feature
                    </Button>
                  </motion.div>
                )}

                {suggestionStep === "form" && (
                  <motion.form
                    key="suggestion-form"
                    onSubmit={handleSuggestFeature}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                  >
                    <div className="space-y-2">
                      <div>
                        <label
                          htmlFor="feature-name"
                          className="text-sm font-medium"
                        >
                          Feature Name
                        </label>
                      </div>
                      <Input
                        id="feature-name"
                        value={suggestionName}
                        onChange={(e) => setSuggestionName(e.target.value)}
                        placeholder="e.g., Dark mode for course pages"
                        required
                        disabled={isSubmitting}
                        autoFocus
                        className="rounded-md bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label
                          htmlFor="feature-description"
                          className="text-sm font-medium"
                        >
                          Description
                        </label>
                      </div>
                      <Textarea
                        id="feature-description"
                        value={suggestionDescription}
                        onChange={(e) =>
                          setSuggestionDescription(e.target.value)
                        }
                        placeholder="Describe the feature and why it would be useful..."
                        required
                        disabled={isSubmitting}
                        className="rounded-md bg-input min-h-24"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Suggestion"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSuggestionStep("closed")
                          setSuggestionName("")
                          setSuggestionDescription("")
                          setSuggestionError(null)
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.form>
                )}

                {suggestionStep === "success" && (
                  <motion.div
                    key="suggestion-success"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.4, 0.0, 0.2, 1] }}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 p-1.5">
                        <Check className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          Suggestion sent — thank you!
                        </div>
                        <div className="text-sm text-muted-foreground">
                          We’ll review it shortly and may add it to the roadmap.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {suggestionStep === "error" && (
                  <motion.div
                    key="suggestion-error"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: [0.4, 0.0, 0.2, 1] }}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 p-1.5">
                        <XCircle className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">Couldn’t submit</div>
                        <div className="text-sm text-muted-foreground">
                          {suggestionError ===
                          "User must be authenticated to suggest features"
                            ? "Please sign in and try again."
                            : suggestionError ||
                              "Something went wrong. Please try again."}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => setSuggestionStep("form")}
                          >
                            Try again
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSuggestionStep("closed")
                              setSuggestionName("")
                              setSuggestionDescription("")
                              setSuggestionError(null)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
