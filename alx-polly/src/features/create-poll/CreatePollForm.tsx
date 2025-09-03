"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usePollCreation } from "@/hooks/usePollCreation";
import { usePollFormValidation } from "@/hooks/usePollFormValidation";
import { FormField, TextFormField } from "@/components/forms/FormField";
import { OptionsList } from "@/components/forms/OptionsList";
import { LoadingSpinner, InlineSpinner } from "@/components/loading/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { CreatePollInput } from "@/lib/validations/poll";

const programmingLanguages = [
  "JavaScript",
  "Python",
  "TypeScript",
  "Java",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Swift",
  "Kotlin"
];

function CreatePollFormContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createPoll, isSubmitting, error: submitError, clearError } = usePollCreation();
  const { errors, validateField, validateForm, clearError: clearFieldError } = usePollFormValidation();
  
  const [question, setQuestion] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customOption, setCustomOption] = useState("");

  const handleLanguageSelect = (language: string) => {
    if (!selectedLanguages.includes(language) && selectedLanguages.length < 10) {
      const newOptions = [...selectedLanguages, language];
      setSelectedLanguages(newOptions);
      validateField('options', newOptions);
      clearFieldError('options');
    }
  };

  const removeLanguage = (language: string) => {
    const newOptions = selectedLanguages.filter(lang => lang !== language);
    setSelectedLanguages(newOptions);
    validateField('options', newOptions);
  };

  const addCustomOption = () => {
    const trimmedOption = customOption.trim();
    if (trimmedOption && 
        !selectedLanguages.includes(trimmedOption) && 
        selectedLanguages.length < 10) {
      const newOptions = [...selectedLanguages, trimmedOption];
      setSelectedLanguages(newOptions);
      setCustomOption("");
      validateField('options', newOptions);
      clearFieldError('options');
    }
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    validateField('title', value);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const pollData: CreatePollInput = {
      title: question.trim(),
      description: "Programming language preference poll",
      options: selectedLanguages,
      expiresIn: 24 * 60, // 24 hours in minutes
      allowMultipleVotes: false,
      requireAuth: true,
    };

    const validation = validateForm(pollData);
    if (!validation.success) {
      return;
    }

    try {
      await createPoll(pollData);
      // Reset form on success
      setQuestion("");
      setSelectedLanguages([]);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to create poll:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12">
      <div className="container mx-auto px-4">
        <Card className="w-full max-w-3xl mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-lg dark:bg-slate-800/80 animate-fade-in">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 w-fit mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create a New Poll
            </CardTitle>
            <p className="text-muted-foreground text-lg mt-2">
              Start engaging conversations about programming languages
            </p>
          </CardHeader>
          <CardContent>
            {/* Loading state */}
            {authLoading && (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" message="Loading..." />
              </div>
            )}

            {/* Authentication required */}
            {!authLoading && !user && (
              <div className="text-center py-8 space-y-4">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold">Authentication Required</h3>
                <p className="text-muted-foreground">You need to be logged in to create polls.</p>
                <Button 
                  onClick={() => router.push('/login')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Sign In
                </Button>
              </div>
            )}

            {/* Poll creation form */}
            {!authLoading && user && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Error display */}
                {submitError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 flex items-center gap-2">
                      <span>⚠️</span>
                      {submitError}
                    </p>
                  </div>
                )}

                {/* Question Field */}
                <TextFormField
                  label="Poll Question"
                  icon="❓"
                  required
                  error={errors.title}
                  description="Write a clear, engaging question that ends with a question mark"
                >
                  <Input
                    placeholder="What's your favorite programming language?"
                    value={question}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    disabled={isSubmitting}
                    className="text-lg"
                  />
                </TextFormField>

                {/* Language Selection */}
                <FormField
                  label="Programming Languages"
                  icon="💻"
                  description="Choose from popular programming languages"
                >
                  <Select onValueChange={handleLanguageSelect} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a programming language" />
                    </SelectTrigger>
                    <SelectContent>
                      {programmingLanguages.map((language) => (
                        <SelectItem
                          key={language}
                          value={language}
                          disabled={selectedLanguages.includes(language)}
                        >
                          {language}
                          {selectedLanguages.includes(language) && " ✓"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Custom Option */}
                <FormField
                  label="Custom Option"
                  icon="⚡"
                  description="Add your own programming language or framework"
                >
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add your own programming language..."
                      value={customOption}
                      onChange={(e) => setCustomOption(e.target.value)}
                      disabled={isSubmitting}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomOption();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addCustomOption}
                      disabled={!customOption.trim() || selectedLanguages.length >= 10 || isSubmitting}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                </FormField>

                {/* Options List */}
                <OptionsList 
                  options={selectedLanguages}
                  onRemove={removeLanguage}
                  disabled={isSubmitting}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !question.trim() || selectedLanguages.length < 2}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <InlineSpinner className="mr-2" />
                      Creating Poll...
                    </>
                  ) : (
                    <>
                      🚀 Create Poll (24h expiry)
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreatePollForm() {
  return (
    <ErrorBoundary>
      <CreatePollFormContent />
    </ErrorBoundary>
  );
}
