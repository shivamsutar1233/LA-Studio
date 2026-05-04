"use client";

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User, Loader2, Image as ImageIcon, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  mediaUrls?: string; // JSON string array
}

interface ReviewsSectionProps {
  targetId: string;
  targetType: 'gear' | 'bundle';
}

export default function ReviewsSection({ targetId, targetType }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, [targetId]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/api/reviews/${targetId}`);
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    const storage = localStorage.getItem('auth-storage');
    if (storage) {
      try {
        const { state } = JSON.parse(storage);
        if (state.user) {
          setUser(state.user);
        }
      } catch (e) {
        console.error('Error parsing auth-storage', e);
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (selectedFiles.length + files.length > 5) {
        toast.error('Limit Exceeded', { description: 'You can upload up to 5 media files.' });
        return;
      }
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadMedia = async () => {
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/reviews/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      urls.push(res.data.url);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Login Required', { description: 'Please login to post a review.' });
      return;
    }

    if (!comment.trim()) {
      toast.error('Missing Comment', { description: 'Please add a comment to your review.' });
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaUrls = '[]';
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const uploadedUrls = await uploadMedia();
        mediaUrls = JSON.stringify(uploadedUrls);
        setIsUploading(false);
      }

      const res = await api.post('/api/reviews', {
        targetId,
        targetType,
        rating,
        comment,
        mediaUrls
      });
      setReviews([res.data, ...reviews]);
      setComment('');
      setRating(5);
      setSelectedFiles([]);
      toast.success('Review Posted', { description: 'Thank you for your feedback!' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to post review';
      toast.error('Error', { description: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="mt-16 pt-16 border-t border-surface-border/50">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Summary & Form */}
        <div className="lg:w-1/3">
          <h2 className="text-3xl font-bold text-foreground mb-4">Customer Reviews</h2>
          <div className="flex items-center gap-4 mb-8">
            <div className="text-5xl font-black text-foreground">{averageRating}</div>
            <div className="flex flex-col">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-5 w-5 ${s <= Math.round(Number(averageRating)) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Based on {reviews.length} reviews</div>
            </div>
          </div>

          {user ? (
            <form onSubmit={handleSubmit} className="bg-surface/30 backdrop-blur-md border border-surface-border/50 p-6 rounded-3xl shadow-xl">
              <h3 className="text-lg font-bold text-foreground mb-4">Share your feedback</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${rating >= s ? 'bg-yellow-500 text-white' : 'bg-surface-border/30 text-muted-foreground'}`}
                    >
                      <Star className={`h-5 w-5 ${rating >= s ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full px-4 py-3 rounded-2xl border border-surface-border/50 bg-background/50 dark:bg-surface/50 backdrop-blur-xl text-foreground text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 min-h-[120px] resize-none mb-4"
                />

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-surface-border group">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-surface-border/30 flex items-center justify-center text-[10px]">VIDEO</div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {selectedFiles.length < 5 && (
                      <label className="h-16 w-16 rounded-lg border-2 border-dashed border-surface-border/50 flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all text-muted-foreground">
                        <ImageIcon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-bold">Add</span>
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isSubmitting ? (isUploading ? 'Uploading Media...' : 'Posting...') : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="bg-surface/30 backdrop-blur-md border border-surface-border/50 p-6 rounded-3xl text-center">
              <p className="text-muted-foreground mb-4 font-medium">Log in to share your review with the community.</p>
              <button 
                onClick={() => window.location.href = '/auth/login'}
                className="text-accent font-bold hover:underline"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>

        {/* Right: Reviews List */}
        <div className="lg:w-2/3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-surface/20 border border-surface-border/30 p-6 rounded-3xl backdrop-blur-sm transition-all duration-300 hover:border-surface-border/60">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{review.userName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {review.comment}
                  </p>
                  
                  {review.mediaUrls && (
                    <div className="flex flex-wrap gap-3">
                      {JSON.parse(review.mediaUrls).map((url: string, i: number) => (
                        <div key={i} className="h-24 w-24 rounded-xl overflow-hidden border border-surface-border/50 cursor-pointer hover:scale-105 transition-transform" onClick={() => setViewingMedia(url)}>
                          {url.match(/\.(mp4|webm|ogg)$/) ? (
                            <video src={url} className="h-full w-full object-cover" />
                          ) : (
                            <img src={url} className="h-full w-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center bg-surface/10 rounded-3xl border border-dashed border-surface-border/50">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>

      {/* Media Modal */}
      {viewingMedia && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setViewingMedia(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-accent transition-colors z-[110]"
            onClick={() => setViewingMedia(null)}
          >
            <X className="h-10 w-10" />
          </button>
          
          <div className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {viewingMedia.match(/\.(mp4|webm|ogg)$/) ? (
              <video src={viewingMedia} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl" />
            ) : (
              <img src={viewingMedia} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
