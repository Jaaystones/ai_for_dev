"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatePollData } from "@/types/poll";

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

export default function CreatePollForm() {
  const [question, setQuestion] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customOption, setCustomOption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageSelect = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const removeLanguage = (language: string) => {
    setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
  };

  const addCustomOption = () => {
    if (customOption.trim() && !selectedLanguages.includes(customOption.trim())) {
      setSelectedLanguages([...selectedLanguages, customOption.trim()]);
      setCustomOption("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || selectedLanguages.length < 2) {
      alert("Please provide a question and at least 2 options");
      return;
    }

    setIsSubmitting(true);
    
    const pollData: CreatePollData = {
      question: question.trim(),
      options: selectedLanguages
    };

    // TODO: Implement API call to create poll
    console.log("Creating poll:", pollData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset form
    setQuestion("");
    setSelectedLanguages([]);
    setIsSubmitting(false);
    
    alert("Poll created successfully!");
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
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="question" className="text-base font-semibold flex items-center gap-2">
                  <span className="text-lg">❓</span>
                  Poll Question
                </Label>
                <Input
                  id="question"
                  placeholder="What's your favorite programming language for web development?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  className="h-12 text-base border-2 focus:border-purple-400 transition-colors"
                />
                <p className="text-sm text-muted-foreground">
                  Make it engaging and specific to get the best responses!
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="text-lg">💻</span>
                  Select Programming Languages
                </Label>
                <Select onValueChange={handleLanguageSelect}>
                  <SelectTrigger className="h-12 text-base border-2">
                    <SelectValue placeholder="Choose from popular programming languages" />
                  </SelectTrigger>
                  <SelectContent>
                    {programmingLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang} className="text-base py-3">
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="text-lg">➕</span>
                  Add Custom Option
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add your own programming language"
                    value={customOption}
                    onChange={(e) => setCustomOption(e.target.value)}
                    className="h-12 text-base border-2 flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addCustomOption} 
                    variant="outline"
                    className="h-12 px-6 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:border-purple-500"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {selectedLanguages.length > 0 && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    Selected Options ({selectedLanguages.length})
                    {selectedLanguages.length >= 2 && (
                      <span className="text-sm text-green-600 dark:text-green-400 ml-2">✓ Ready to publish</span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {selectedLanguages.map((lang, index) => (
                      <div
                        key={lang}
                        className="group flex items-center gap-2 bg-white dark:bg-slate-700 px-4 py-2 rounded-full border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <span className="font-medium">{lang}</span>
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang)}
                          className="ml-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {selectedLanguages.length < 2 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <span>⚠️</span>
                      Add at least {2 - selectedLanguages.length} more option{2 - selectedLanguages.length !== 1 ? 's' : ''} to create your poll
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50" 
                  disabled={isSubmitting || !question.trim() || selectedLanguages.length < 2}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Poll...
                    </>
                  ) : (
                    <>
                      🚀 Create Poll (24h expiry)
                    </>
                  )}
                </Button>
                
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Your poll will be live for 24 hours and then automatically close
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
