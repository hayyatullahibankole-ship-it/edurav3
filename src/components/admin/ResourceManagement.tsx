import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plus, 
  Upload,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Video,
  Image,
  File,
  Globe,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  subject_id: string;
  access_level: string;
  tags: any;
  download_count: number;
  view_count: number;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function ResourceManagement() {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    file: null as File | null,
    file_type: '',
    category: 'past-questions' as 'past-questions' | 'syllabus' | 'books',
    subject_id: '',
    access_level: 'free' as 'free' | 'premium',
    tags: [] as string[],
    youtube_url: '',
    resource_type: 'file' as 'file' | 'video' | 'link'
  });

  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<FileList | null>(null);
  const [bulkCategory, setBulkCategory] = useState<'past-questions' | 'syllabus' | 'books'>('past-questions');
  const [brokenResources, setBrokenResources] = useState<Resource[]>([]);
  const [isFixingResources, setIsFixingResources] = useState(false);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for resources
    const resourcesChannel = supabase
      .channel('resources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Set up real-time subscription for subjects
    const subjectsChannel = supabase
      .channel('subjects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subjects'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resourcesChannel);
      supabase.removeChannel(subjectsChannel);
    };
  }, []);

  useEffect(() => {
    if (resources.length > 0) {
      checkBrokenResources();
    }
  }, [resources]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [resourcesResp, subjectsResp] = await Promise.all([
        supabase.from('resources').select(`
          *,
          subjects(name, code)
        `).order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').eq('is_active', true)
      ]);

      setResources(resourcesResp.data || []);
      setSubjects(subjectsResp.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load resources data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (file) {
      setNewResource(prev => ({
        ...prev,
        file,
        file_type: file.type,
        title: prev.title || file.name.split('.')[0]
      }));
    }
  };

  const handleUploadResource = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setLoading(true);
      
      let fileUrl = '';
      let fileSize = 0;
      let fileType = newResource.file_type;

      if (newResource.resource_type === 'file' && newResource.file) {
        // Upload file to Supabase Storage
        const fileName = `${Date.now()}-${newResource.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(fileName, newResource.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('resources')
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
        fileSize = newResource.file.size;
        fileType = newResource.file.type;
      } else if (newResource.resource_type === 'video') {
        fileUrl = newResource.youtube_url;
        fileType = 'video/youtube';
      } else if (newResource.resource_type === 'link') {
        fileUrl = newResource.youtube_url;
        fileType = 'text/html';
      }

      const resourceData = {
        title: newResource.title,
        description: newResource.description,
        file_url: fileUrl,
        file_type: fileType,
        file_size_bytes: fileSize,
        subject_id: newResource.subject_id || null,
        access_level: newResource.access_level,
        tags: [...newResource.tags, newResource.category],
        is_active: true,
        download_count: 0,
        view_count: 0
      };

      const { error } = await supabase.from('resources').insert(resourceData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource uploaded successfully"
      });

      setIsUploadModalOpen(false);
      resetNewResource();
      fetchData();
      
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast({
        title: "Error",
        description: "Failed to upload resource",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewResource = () => {
    setNewResource({
      title: '',
      description: '',
      file: null,
      file_type: '',
      category: 'past-questions',
      subject_id: '',
      access_level: 'free',
      tags: [],
      youtube_url: '',
      resource_type: 'file'
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkFiles || bulkFiles.length === 0) return;

    try {
      setLoading(true);
      const resourcesToInsert: any[] = [];

      // Upload each file to Supabase Storage
      for (const file of Array.from(bulkFiles)) {
        try {
          const fileName = `${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resources')
            .upload(fileName, file);

          if (uploadError) {
            console.warn(`Failed to upload ${file.name}:`, uploadError);
            continue; // Skip this file but continue with others
          }

          // Get public URL for the uploaded file
          const { data: urlData } = supabase.storage
            .from('resources')
            .getPublicUrl(fileName);

          resourcesToInsert.push({
            title: file.name.split('.')[0],
            description: `Bulk uploaded file: ${file.name}`,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size_bytes: file.size,
            subject_id: subjects[0]?.id || null, // Default to first subject
            access_level: 'free',
            tags: [bulkCategory],
            is_active: true,
            download_count: 0,
            view_count: 0
          });
        } catch (fileError) {
          console.warn(`Error processing ${file.name}:`, fileError);
        }
      }

      if (resourcesToInsert.length === 0) {
        throw new Error('No files were successfully uploaded');
      }

      const { error } = await supabase.from('resources').insert(resourcesToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${resourcesToInsert.length} resources uploaded successfully`
      });

      setIsBulkUploadOpen(false);
      setBulkFiles(null);
      setBulkCategory('past-questions');
      fetchData();

    } catch (error) {
      console.error('Error bulk uploading:', error);
      toast({
        title: "Error",
        description: "Failed to upload resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/') || fileType === 'video/youtube') {
      return <Video className="w-5 h-5" />;
    } else if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (fileType === 'text/html') {
      return <Globe className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const checkBrokenResources = async () => {
    try {
      const broken: Resource[] = [];
      
      for (const resource of resources) {
        if (!resource.file_url.startsWith('http')) {
          // Check if file exists in storage
          let bucketName = 'uploads';
          let filePath = resource.file_url;

          if (resource.file_url.startsWith('uploads/')) {
            bucketName = 'uploads';
            filePath = resource.file_url.replace('uploads/', '');
          } else if (resource.file_url.includes('/')) {
            const pathParts = resource.file_url.split('/');
            bucketName = pathParts[0];
            filePath = pathParts.slice(1).join('/');
          } else {
            bucketName = 'resources';
            filePath = resource.file_url;
          }

          try {
            const { error } = await supabase.storage
              .from(bucketName)
              .download(filePath);

            if (error) {
              broken.push(resource);
            }
          } catch {
            broken.push(resource);
          }
        }
      }
      
      setBrokenResources(broken);
    } catch (error) {
      console.error('Error checking broken resources:', error);
    }
  };

  const fixBrokenResource = async (resource: Resource, file: File) => {
    try {
      const fileName = `fixed-resources/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName);

      // Update resource with new URL
      const { error: updateError } = await supabase
        .from('resources')
        .update({
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size_bytes: file.size
        })
        .eq('id', resource.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Fixed resource: ${resource.title}`,
      });

      return true;
    } catch (error) {
      console.error('Error fixing resource:', error);
      toast({
        title: "Error",
        description: `Failed to fix resource: ${resource.title}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleBulkFixResources = async () => {
    if (!bulkFiles || bulkFiles.length === 0) return;

    try {
      setIsFixingResources(true);
      let fixed = 0;
      
      const fileArray = Array.from(bulkFiles);
      
      for (const file of fileArray) {
        // Try to match file with broken resource by name
        const matchingResource = brokenResources.find(resource => {
          const resourceName = resource.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          const fileName = file.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return fileName.includes(resourceName) || resourceName.includes(fileName);
        });

        if (matchingResource) {
          const success = await fixBrokenResource(matchingResource, file);
          if (success) fixed++;
        }
      }

      toast({
        title: "Bulk Fix Complete",
        description: `Fixed ${fixed} out of ${fileArray.length} resources`,
      });

      fetchData();
      checkBrokenResources();
      setBulkFiles(null);
    } catch (error) {
      console.error('Error in bulk fix:', error);
      toast({
        title: "Error",
        description: "Bulk fix operation failed",
        variant: "destructive",
      });
    } finally {
      setIsFixingResources(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (Array.isArray(resource.tags) && resource.tags.length > 0 && resource.tags.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesSubject = selectedSubject === 'all' || resource.subject_id === selectedSubject;
    const matchesType = selectedType === 'all' || resource.file_type?.startsWith(selectedType);
    
    // Category filter logic
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const title = resource.title?.toLowerCase() || '';
      const description = resource.description?.toLowerCase() || '';
      
      if (selectedCategory === 'syllabus') {
        matchesCategory = title.includes('syllabus') || description.includes('syllabus');
      } else if (selectedCategory === 'books') {
        matchesCategory = resource.file_type?.includes('pdf') || resource.file_type?.includes('book');
      } else if (selectedCategory === 'past-questions') {
        matchesCategory = !title.includes('syllabus') && !description.includes('syllabus');
      }
    }
    
    return matchesSearch && matchesSubject && matchesType && matchesCategory;
  });

  const workingResources = filteredResources.filter(resource => 
    !brokenResources.some(broken => broken.id === resource.id)
  );

  // Early return with loading state if data is still loading on first mount
  if (loading && resources.length === 0 && subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-400">Loading resources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6"
data-testid="resource-management-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Resource Management</h2>
          <p className="text-slate-400">Upload and manage learning resources</p>
        </div>
        
        <div className="flex space-x-3">
          {brokenResources.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="relative">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Fix Broken Resources ({brokenResources.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Fix Broken Resources</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      {brokenResources.length} resources have broken file links. Upload the correct files to fix them.
                    </p>
                  </div>
                  
                  <div>
                    <Label>Broken Resources:</Label>
                    <div className="max-h-32 overflow-auto space-y-1 border rounded p-2 bg-gray-50">
                      {brokenResources.map((resource) => (
                        <div key={resource.id} className="text-sm p-1 bg-white rounded border">
                          {resource.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fixFiles">Select Files to Fix Broken Resources</Label>
                    <Input
                      id="fixFiles"
                      type="file"
                      multiple
                      onChange={(e) => setBulkFiles(e.target.files)}
                      className="mt-1"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Select files that match the broken resource names. The system will try to match them automatically.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleBulkFixResources} 
                      disabled={isFixingResources || !bulkFiles || bulkFiles.length === 0}
                      className="flex-1"
                    >
                      {isFixingResources ? 'Fixing...' : `Fix Resources`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Bulk Upload Resources</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulkCategory">Category</Label>
                  <Select value={bulkCategory} onValueChange={(value: any) => setBulkCategory(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="past-questions">Past Questions</SelectItem>
                      <SelectItem value="syllabus">Syllabus</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bulkFiles">Select Multiple Files</Label>
                  <Input
                    id="bulkFiles"
                    type="file"
                    multiple
                    onChange={(e) => setBulkFiles(e.target.files)}
                    className="mt-1"
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Select multiple PDFs, videos, or other learning resources
                  </p>
                </div>

                {bulkFiles && bulkFiles.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Selected Files ({bulkFiles.length})</h4>
                    <div className="max-h-32 overflow-auto space-y-1">
                      {Array.from(bulkFiles).map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-slate-100 rounded">
                          <span className="truncate">{file.name}</span>
                          <span className="text-slate-500">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBulkUpload();
                    }} 
                    disabled={loading || !bulkFiles || bulkFiles.length === 0}
                    className="flex-1"
                  >
                    {loading ? 'Uploading...' : `Upload ${bulkFiles?.length || 0} Resources`}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsBulkUploadOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload New Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>Resource Type</Label>
                  <Select value={newResource.resource_type} onValueChange={(value: any) => setNewResource({...newResource, resource_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">File Upload (PDF, DOC, etc.)</SelectItem>
                      <SelectItem value="video">Video Link (YouTube, Vimeo)</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newResource.resource_type === 'file' && (
                  <div>
                    <Label htmlFor="file">Select File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                  </div>
                )}

                {(newResource.resource_type === 'video' || newResource.resource_type === 'link') && (
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={newResource.youtube_url}
                      onChange={(e) => setNewResource({...newResource, youtube_url: e.target.value})}
                      placeholder="https://youtube.com/watch?v=... or https://edura.com"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    placeholder="Resource title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    placeholder="Describe what this resource covers..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newResource.category} onValueChange={(value: any) => setNewResource({...newResource, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="past-questions">Past Questions</SelectItem>
                        <SelectItem value="syllabus">Syllabus</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="access">Access Level</Label>
                    <Select value={newResource.access_level} onValueChange={(value: any) => setNewResource({...newResource, access_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free Access</SelectItem>
                        <SelectItem value="premium">Premium Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={Array.isArray(newResource.tags) ? newResource.tags.join(', ') : ''}
                    onChange={(e) => setNewResource({...newResource, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                    placeholder="study guide, revision, past questions"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUploadResource(e);
                    }} 
                    disabled={loading} 
                    className="flex-1"
                  >
                    {loading ? 'Uploading...' : 'Upload Resource'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsUploadModalOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resource Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Resources</p>
                <p className="text-2xl font-bold text-blue-400">{resources.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Downloads</p>
                <p className="text-2xl font-bold text-green-400">
                  {resources.reduce((sum, r) => sum + r.download_count, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Views</p>
                <p className="text-2xl font-bold text-purple-400">
                  {resources.reduce((sum, r) => sum + r.view_count, 0)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Storage Used</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {formatFileSize(resources.reduce((sum, r) => sum + (r.file_size_bytes || 0), 0))}
                </p>
              </div>
              <FolderOpen className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="past-questions">Past Questions</SelectItem>
                <SelectItem value="syllabus">Syllabus</SelectItem>
                <SelectItem value="books">Books</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="application">Documents</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="text">Links</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="all" className="text-white">All Resources</TabsTrigger>
          <TabsTrigger value="free" className="text-white">Free</TabsTrigger>
          <TabsTrigger value="premium" className="text-white">Premium</TabsTrigger>
          <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="flex items-start justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-slate-600 rounded">
                        {getFileIcon(resource.file_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white">{resource.title}</h3>
                          <Badge className={resource.access_level === 'premium' ? 'bg-yellow-600' : 'bg-green-600'}>
                            {resource.access_level}
                          </Badge>
                          <Badge variant="outline" className="text-slate-300">
                            {subjects.find(s => s.id === resource.subject_id)?.name || 'Unknown'}
                          </Badge>
                          {!resource.is_active && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-slate-300 text-sm mb-2 line-clamp-2">
                          {resource.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span>{formatFileSize(resource.file_size_bytes || 0)}</span>
                          <span>{resource.download_count} downloads</span>
                          <span>{resource.view_count} views</span>
                          <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                          {resource.tags && Array.isArray(resource.tags) && resource.tags.length > 0 && (
                            <span>Tags: {resource.tags.slice(0, 3).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Preview",
                            description: `Viewing ${resource.title}`
                          });
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (resource.file_url.startsWith('http')) {
                            window.open(resource.file_url, '_blank');
                          } else {
                            const { data } = supabase.storage
                              .from('resources')
                              .getPublicUrl(resource.file_url);
                            if (data.publicUrl) {
                              window.open(data.publicUrl, '_blank');
                            }
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingResource(resource)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Analytics",
                            description: `Analytics for ${resource.title}`
                          });
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${resource.title}"?`)) {
                            try {
                              const { error } = await supabase
                                .from('resources')
                                .delete()
                                .eq('id', resource.id);
                              
                              if (error) throw error;
                              
                              toast({
                                title: "Success",
                                description: "Resource deleted successfully"
                              });
                              fetchData();
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to delete resource",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredResources.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No resources found</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {searchTerm || selectedSubject !== 'all' || selectedType !== 'all' 
                        ? 'Try adjusting your search filters'
                        : 'Upload your first resource to get started'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {resources.filter(r => r.access_level === 'free').map((resource) => (
                  <div key={resource.id} className="flex items-start justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-green-600 rounded">
                        {getFileIcon(resource.file_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white">{resource.title}</h3>
                          <Badge className="bg-green-600">FREE</Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{resource.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span>{resource.download_count} downloads</span>
                          <span>{resource.view_count} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {resources.filter(r => r.access_level === 'free').length === 0 && (
                  <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No free resources</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {resources.filter(r => r.access_level === 'premium').map((resource) => (
                  <div key={resource.id} className="flex items-start justify-between p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-yellow-600 rounded">
                        {getFileIcon(resource.file_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white">{resource.title}</h3>
                          <Badge className="bg-yellow-600">PREMIUM</Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-2">{resource.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span>{resource.download_count} downloads</span>
                          <span>{resource.view_count} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {resources.filter(r => r.access_level === 'premium').length === 0 && (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No premium resources</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Resource Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Most Downloaded</span>
                    <Download className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-lg font-bold text-green-400">
                    {resources.sort((a, b) => b.download_count - a.download_count)[0]?.title || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {resources.sort((a, b) => b.download_count - a.download_count)[0]?.download_count || 0} downloads
                  </p>
                </div>
                
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Most Viewed</span>
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-lg font-bold text-blue-400">
                    {resources.sort((a, b) => b.view_count - a.view_count)[0]?.title || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {resources.sort((a, b) => b.view_count - a.view_count)[0]?.view_count || 0} views
                  </p>
                </div>
                
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Popular Format</span>
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-lg font-bold text-purple-400">PDF</p>
                  <p className="text-xs text-slate-400">Most common type</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-white font-medium">Top Performing Resources</h4>
                {resources
                  .sort((a, b) => (b.download_count + b.view_count) - (a.download_count + a.view_count))
                  .slice(0, 5)
                  .map((resource, index) => (
                    <div key={resource.id} className="flex items-center justify-between p-3 bg-slate-700 rounded border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{resource.title}</p>
                          <p className="text-xs text-slate-400">{resource.access_level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-400 font-bold">{resource.download_count + resource.view_count}</p>
                        <p className="text-xs text-slate-400">total engagements</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}