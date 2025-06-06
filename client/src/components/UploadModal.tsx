import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, Upload, Video } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("POST", "/api/videos", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setIsPublic(true);
    setAllowComments(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("isPublic", String(isPublic));

    uploadMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-gray-800"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
        <h3 className="text-white font-semibold text-lg">Upload Video</h3>
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || !title.trim() || uploadMutation.isPending}
          className="bg-pink-500 hover:bg-pink-600 text-white border-0"
        >
          {uploadMutation.isPending ? "Uploading..." : "Post"}
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
          {selectedFile ? (
            <div className="space-y-4">
              <Video className="w-12 h-12 text-pink-500 mx-auto" />
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedFile(null)}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-white mb-2">Tap to upload video</p>
                <p className="text-gray-400 text-sm">MP4, MOV up to 100MB</p>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-white">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Give your video a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-pink-500"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Share more about your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-pink-500 h-24 resize-none"
              maxLength={500}
            />
            <p className="text-gray-400 text-xs mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <Label htmlFor="public" className="text-white">
                Make public
              </Label>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="comments" className="text-white">
                Allow comments
              </Label>
              <Switch
                id="comments"
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
