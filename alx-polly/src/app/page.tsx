import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Polly
              </h1>
              <p className="text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Create and participate in programming language polls with our beautiful, intuitive interface
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>24-hour poll expiry</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Real-time results</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Programming focused</span>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
            <Card className="relative overflow-hidden hover-lift border-0 shadow-lg bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    VIEW
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Explore Poll Results
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  Discover which programming languages are trending and see detailed vote breakdowns with beautiful visualizations
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-0">
                <Link href="/polls" className="block">
                  <Button className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
                    View Poll Results
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover-lift border-0 shadow-lg bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    CREATE
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Create New Poll
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  Start engaging conversations about programming languages with our intuitive poll creation tool
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-0">
                <Link href="/create-poll" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base font-medium border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:border-purple-500 dark:hover:bg-purple-900/20 transition-all duration-300"
                  >
                    Create New Poll
                    <span className="ml-2">+</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="text-center space-y-8 animate-fade-in">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Why Choose Polly?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built specifically for developers, with features that make polling about programming languages a delightful experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="group p-8 bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover-lift">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">⏰</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  24-Hour Auto-Expiry
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Keep discussions fresh and relevant with automatic poll expiration after 24 hours
                </p>
              </div>

              <div className="group p-8 bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover-lift">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">💻</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  Developer-Focused
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Curated for programming languages with smart suggestions and developer-friendly interface
                </p>
              </div>

              <div className="group p-8 bg-white/50 backdrop-blur-sm dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover-lift">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📈</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  Beautiful Analytics
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stunning visualizations with real-time progress tracking and winner celebrations
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center py-12 animate-fade-in">
            <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Start Polling?
              </h3>
              <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                Join the conversation and discover what the developer community thinks about programming languages
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create-poll">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 h-auto">
                    Create Your First Poll
                  </Button>
                </Link>
                <Link href="/polls">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3 h-auto">
                    Browse Existing Polls
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
