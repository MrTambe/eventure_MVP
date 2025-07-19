import { motion } from "framer-motion";
import { AuthButton } from "@/components/auth/AuthButton";
import { Button } from "@/components/ui/button";
import { Calendar, Award, Users, MapPin, Clock, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">EventHub</span>
          </div>
          <AuthButton />
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="container mx-auto px-4 py-20 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground"
          >
            Manage Events
            <span className="text-primary block">Effortlessly</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Join events, track your participation, and earn certificates. 
            Your complete event management solution in one place.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <AuthButton 
              trigger={
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started Free
                </Button>
              }
            />
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
              Learn More
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your event experience with our comprehensive platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <Calendar className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Event Discovery</h3>
            <p className="text-muted-foreground">
              Find and register for events that match your interests and schedule.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <Users className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Easy Registration</h3>
            <p className="text-muted-foreground">
              Simple one-click registration process for all your favorite events.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <Award className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Digital Certificates</h3>
            <p className="text-muted-foreground">
              Earn and download certificates for completed events and workshops.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <Clock className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Real-time Updates</h3>
            <p className="text-muted-foreground">
              Get instant notifications about event changes and reminders.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <MapPin className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Venue Information</h3>
            <p className="text-muted-foreground">
              Detailed venue information and directions for all events.
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
          >
            <CheckCircle className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Progress Tracking</h3>
            <p className="text-muted-foreground">
              Track your event participation and achievement progress.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-secondary/30 py-20"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already managing their events with EventHub.
          </p>
          <AuthButton 
            trigger={
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Your Journey
              </Button>
            }
          />
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">EventHub</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}