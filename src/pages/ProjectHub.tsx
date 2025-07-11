
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, TrendingUp, DollarSign, Instagram, ChevronRight, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

// Mock project data
interface Project {
  id: string;
  name: string;
  description: string;
  problem: string;
  uniqueness: string;
  passionTags: string[];
  revenue: number;
  instagramMetrics: {
    views: number;
    likes: number;
    clicks: number;
  };
  createdAt: Date;
}

const mockProjects: Project[] = [
  {
    id: "project1",
    name: "EcoLearn",
    description: "Educational app teaching sustainability practices",
    problem: "Lack of engaging environmental education for teens",
    uniqueness: "Gamified challenges with real-world impact tracking",
    passionTags: ["education", "environment"],
    revenue: 450,
    instagramMetrics: { views: 2800, likes: 340, clicks: 120 },
    createdAt: new Date(Date.now() - 3600000 * 24 * 7),
  },
  {
    id: "project2",
    name: "CodeBuddy",
    description: "AI-powered coding tutor for beginners",
    problem: "Programming concepts are hard to grasp for beginners",
    uniqueness: "Personalized learning path with real-time feedback",
    passionTags: ["tech", "education"],
    revenue: 180,
    instagramMetrics: { views: 1200, likes: 130, clicks: 85 },
    createdAt: new Date(Date.now() - 3600000 * 24 * 14),
  },
];

const ProjectHub = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    problem: "",
    uniqueness: "",
    passionTags: [] as string[],
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [revenueInput, setRevenueInput] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Available passion tags
  const availableTags = [
    { id: "tech", label: "Technology" },
    { id: "business", label: "Business" },
    { id: "art", label: "Art & Design" },
    { id: "environment", label: "Environment" },
    { id: "education", label: "Education" },
    { id: "social", label: "Social Impact" },
  ];

  const handleCreateProject = () => {
    // Validate form
    if (!newProject.name || !newProject.description || !newProject.problem || 
        !newProject.uniqueness || newProject.passionTags.length === 0) {
      return;
    }
    
    // Create new project
    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      problem: newProject.problem,
      uniqueness: newProject.uniqueness,
      passionTags: newProject.passionTags,
      revenue: 0,
      instagramMetrics: { views: 0, likes: 0, clicks: 0 },
      createdAt: new Date(),
    };
    
    // Add to projects list
    setProjects([project, ...projects]);
    
    // Reset form and close dialog
    setNewProject({
      name: "",
      description: "",
      problem: "",
      uniqueness: "",
      passionTags: [],
    });
    setIsNewProjectDialogOpen(false);
  };

  const toggleProjectTag = (tagId: string) => {
    if (newProject.passionTags.includes(tagId)) {
      setNewProject({
        ...newProject,
        passionTags: newProject.passionTags.filter(id => id !== tagId),
      });
    } else {
      setNewProject({
        ...newProject,
        passionTags: [...newProject.passionTags, tagId],
      });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };
  
  const handleEditRevenue = () => {
    if (!selectedProject) return;
    setRevenueInput(selectedProject.revenue);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setRevenueInput('');
  };
  
  const handleSaveRevenue = () => {
    if (!selectedProject) return;
    
    if (revenueInput === '' || (typeof revenueInput === 'number' && revenueInput < 0)) {
      toast({
        title: "🚫 Couldn't save",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      try {
        // Update the project in the projects array
        const updatedProjects = projects.map(p => {
          if (p.id === selectedProject.id) {
            return {
              ...p, 
              revenue: typeof revenueInput === 'number' ? revenueInput : 0
            };
          }
          return p;
        });
        
        setProjects(updatedProjects);
        
        // Update the selected project
        setSelectedProject(prev => prev ? {
          ...prev,
          revenue: typeof revenueInput === 'number' ? revenueInput : 0
        } : null);
        
        setIsEditing(false);
        setIsSaving(false);
        
        toast({
          title: "💰 Revenue saved.",
          description: "Project revenue has been updated",
        });
      } catch (error) {
        setIsSaving(false);
        toast({
          title: "🚫 Couldn't save. Check connection.",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-ct-paper p-5 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold font-poppins">Project Hub</h1>
        <Button 
          onClick={() => setIsNewProjectDialogOpen(true)}
          className="bg-ct-teal hover:bg-ct-teal/90"
        >
          <PlusCircle size={18} className="mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-ct-white rounded-card shadow-ct p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-ct-sky/20 rounded-full flex items-center justify-center mb-4">
            <PlusCircle size={24} className="text-ct-teal" />
          </div>
          <h3 className="text-xl font-medium mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Start your entrepreneurial journey by creating your first project!</p>
          <Button 
            onClick={() => setIsNewProjectDialogOpen(true)}
            className="bg-ct-teal hover:bg-ct-teal/90"
          >
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-ct-white rounded-card shadow-ct overflow-hidden cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <div className="p-5">
                <h2 className="text-xl font-medium mb-1">{project.name}</h2>
                <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.passionTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs bg-ct-sky/20 text-gray-700 px-2 py-1 rounded-pill"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center text-gray-600 mb-1">
                      <DollarSign size={14} className="mr-1" />
                      <span>Revenue</span>
                    </div>
                    <div className="font-semibold">${project.revenue}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center text-gray-600 mb-1">
                      <Instagram size={14} className="mr-1" />
                      <span>Views</span>
                    </div>
                    <div className="font-semibold">{formatNumber(project.instagramMetrics.views)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center text-gray-600 mb-1">
                      <TrendingUp size={14} className="mr-1" />
                      <span>Clicks</span>
                    </div>
                    <div className="font-semibold">{formatNumber(project.instagramMetrics.clicks)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 flex justify-between items-center border-t">
                <span className="text-xs text-gray-500">
                  Created on {project.createdAt.toLocaleDateString()}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Project</DialogTitle>
            <DialogDescription>
              Tell us about your business idea to create a personalized project plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="E.g., EcoLearn, TechBuddy..."
              />
            </div>
            
            <div>
              <Label htmlFor="project-description">Short Description</Label>
              <Input
                id="project-description"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="One-sentence description of your project"
              />
            </div>
            
            <div>
              <Label htmlFor="project-problem">Problem You're Solving</Label>
              <Textarea
                id="project-problem"
                value={newProject.problem}
                onChange={(e) => setNewProject({...newProject, problem: e.target.value})}
                placeholder="What problem does your project address?"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="project-uniqueness">What Makes It Unique?</Label>
              <Textarea
                id="project-uniqueness"
                value={newProject.uniqueness}
                onChange={(e) => setNewProject({...newProject, uniqueness: e.target.value})}
                placeholder="What's different about your approach?"
                rows={2}
              />
            </div>
            
            <div>
              <Label>Select Related Passions (at least one)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => toggleProjectTag(tag.id)}
                    className={`
                      p-2 rounded border cursor-pointer text-sm
                      ${newProject.passionTags.includes(tag.id) 
                        ? 'bg-ct-teal/10 border-ct-teal' 
                        : 'border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                    {tag.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleCreateProject}
                disabled={
                  !newProject.name || 
                  !newProject.description || 
                  !newProject.problem ||
                  !newProject.uniqueness || 
                  newProject.passionTags.length === 0
                }
                className="bg-ct-teal hover:bg-ct-teal/90"
              >
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedProject.name}</DialogTitle>
              <DialogDescription>
                {selectedProject.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Project Details */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-medium mb-1">Problem Statement</h3>
                  <p className="text-gray-600 text-sm">{selectedProject.problem}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Unique Approach</h3>
                  <p className="text-gray-600 text-sm">{selectedProject.uniqueness}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedProject.passionTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs bg-ct-sky/20 text-gray-700 px-2 py-1 rounded-pill"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-200"></div>
              
              {/* Performance Metrics */}
              <div>
                <h3 className="font-medium mb-3">Performance Metrics</h3>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Revenue Card */}
                  <Card className="p-5 relative">
                    {isSaving && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
                        <Loader2 className="animate-spin text-ct-teal" />
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <DollarSign size={18} className="text-green-600 mr-1" />
                        <span className="font-medium">Revenue</span>
                      </div>
                      {!isEditing && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRevenue();
                          }}
                          className="text-ct-teal hover:text-ct-teal/90 p-1 h-auto"
                        >
                          <Edit size={16} />
                          <span className="ml-1">Edit</span>
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-3xl font-semibold mb-2">
                      ${selectedProject.revenue}
                    </div>
                    
                    {/* Edit Panel */}
                    {isEditing && (
                      <div className="mt-3 flex flex-wrap gap-3 items-center">
                        <Input
                          type="number"
                          min={0}
                          value={revenueInput}
                          onChange={(e) => setRevenueInput(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-32"
                          placeholder="Enter amount"
                          autoFocus
                        />
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRevenue();
                            }}
                            size="sm"
                            className="bg-ct-teal hover:bg-ct-teal/90"
                          >
                            Save
                          </Button>
                          
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-ct-teal"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {/* Instagram Analytics Card */}
                  <Card className="p-5">
                    <div className="flex items-center mb-2">
                      <Instagram size={18} className="text-purple-600 mr-1" />
                      <span className="font-medium">Instagram Analytics</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-600">Views</div>
                        <div className="font-semibold">{formatNumber(selectedProject.instagramMetrics.views)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-600">Likes</div>
                        <div className="font-semibold">{formatNumber(selectedProject.instagramMetrics.likes)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-600">Clicks</div>
                        <div className="font-semibold">{formatNumber(selectedProject.instagramMetrics.clicks)}</div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* XP Bonuses */}
                <Card className="bg-gray-50 p-4 mt-4 border">
                  <div className="font-medium mb-2">XP Bonuses</div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-1">
                      <span>Revenue Bonus:</span>
                      <span>+{Math.floor(selectedProject.revenue / 10) * 5} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instagram Views Bonus:</span>
                      <span>+{Math.floor(selectedProject.instagramMetrics.views / 1000) * 10} XP</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProjectHub;
