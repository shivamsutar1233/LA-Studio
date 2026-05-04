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
            if (selectedFiles.length + files.length > 3) {
                toast.error('Limit Exceeded', { description: 'You can upload up to 3 media files on mobile.' });
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
        <div className="mt-12 pt-12 border-t border-surface-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-4">Reviews</h2>
            
            <div className="flex items-center gap-4 mb-8 bg-surface/20 p-4 rounded-2xl">
                <div className="text-4xl font-black text-foreground">{averageRating}</div>
                <div className="flex flex-col">
                    <div className="flex text-yellow-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= Math.round(Number(averageRating)) ? 'fill-current' : ''}`} />
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">{reviews.length} total reviews</div>
                </div>
            </div>

            {user ? (
                <form onSubmit={handleSubmit} className="bg-surface/30 backdrop-blur-md border border-surface-border/50 p-5 rounded-3xl mb-10">
                    <h3 className="text-md font-bold text-foreground mb-4">Post a review</h3>
                    
                    <div className="mb-4 flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setRating(s)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${rating >= s ? 'bg-yellow-500 text-white' : 'bg-surface-border/30 text-muted-foreground'}`}
                            >
                                <Star className={`h-4 w-4 ${rating >= s ? 'fill-current' : ''}`} />
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write your review..."
                            className="w-full px-4 py-3 rounded-2xl border border-surface-border/50 bg-background/50 dark:bg-surface/50 backdrop-blur-xl text-foreground text-sm focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 min-h-[100px] resize-none mb-4"
                        />

                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedFiles.map((file, i) => (
                                <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-surface-border group">
                                    {file.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-surface-border/30 flex items-center justify-center text-[8px]">VIDEO</div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                                    >
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedFiles.length < 3 && (
                                <label className="h-14 w-14 rounded-lg border-2 border-dashed border-surface-border/50 flex flex-col items-center justify-center cursor-pointer active:bg-accent/5 transition-all text-muted-foreground">
                                    <ImageIcon className="h-4 w-4 mb-0.5" />
                                    <span className="text-[8px] font-bold">Add</span>
                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-accent text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                        {isSubmitting ? (isUploading ? 'Uploading...' : 'Posting...') : 'Submit'}
                    </button>
                </form>
            ) : (
                <div className="bg-surface/30 backdrop-blur-md border border-surface-border/50 p-6 rounded-3xl text-center mb-10">
                    <p className="text-sm text-muted-foreground mb-4">Log in to post a review.</p>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-surface/10 border border-surface-border/20 p-5 rounded-2xl">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-foreground">{review.userName}</div>
                                        <div className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex text-yellow-500">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-current' : ''}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                {review.comment}
                            </p>

                            {review.mediaUrls && (
                                <div className="flex flex-wrap gap-2">
                                    {JSON.parse(review.mediaUrls).map((url: string, i: number) => (
                                        <div key={i} className="h-16 w-16 rounded-lg overflow-hidden border border-surface-border/30" onClick={() => setViewingMedia(url)}>
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
                    ))
                ) : (
                    <div className="py-12 text-center">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No reviews yet.</p>
                    </div>
                )}
            </div>
            </div>

            {/* Media Modal */}
            {viewingMedia && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setViewingMedia(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white hover:text-accent transition-colors z-[110]"
                        onClick={() => setViewingMedia(null)}
                    >
                        <X className="h-8 w-8" />
                    </button>
                    
                    <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {viewingMedia.match(/\.(mp4|webm|ogg)$/) ? (
                            <video src={viewingMedia} controls autoPlay className="max-w-full max-h-full rounded-xl" />
                        ) : (
                            <img src={viewingMedia} className="max-w-full max-h-full object-contain rounded-xl" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
