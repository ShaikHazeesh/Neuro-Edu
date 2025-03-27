import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, Clock, BookOpen, Award } from "lucide-react";
import { motion } from "framer-motion";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  level: string;
  duration: string;
  lessonCount: number;
  progress?: number;
  featured?: boolean;
}

export default function CourseCard({
  id,
  title,
  description,
  imageUrl,
  category,
  level,
  duration,
  lessonCount,
  progress = 0,
  featured = false,
}: CourseCardProps) {
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`overflow-hidden h-full flex flex-col ${
        featured ? 'border-primary/50 shadow-md' : ''
      }`}>
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={title} 
            className="h-48 w-full object-cover"
          />
          {featured && (
            <Badge className="absolute top-3 right-3 bg-primary">
              Featured
            </Badge>
          )}
          <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm">
            {category}
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={
              level === 'Beginner' ? 'outline' :
              level === 'Intermediate' ? 'secondary' : 'default'
            }>
              {level}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-2 flex-1">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{lessonCount} lessons</span>
            </div>
            {progress > 0 && (
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-primary">{progress}% complete</span>
              </div>
            )}
          </div>
          {progress > 0 && (
            <Progress value={progress} className="h-1.5 mb-4" />
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full gap-2">
            <Link href={`/courses/${id}`}>
              {progress > 0 ? (
                <>
                  <Play className="h-4 w-4" /> Continue Learning
                </>
              ) : (
                <>Start Course</>
              )}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}