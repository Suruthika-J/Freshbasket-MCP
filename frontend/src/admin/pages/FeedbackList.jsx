import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiStar, FiMessageSquare, FiFilter, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FeedbackList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState('All'); // 'All', 5, 4, 3, 2, 1
    const [stats, setStats] = useState({ total: 0, avg: 0 });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const sessionData = localStorage.getItem('adminSession');
            if (!sessionData) return;
            // No strict auth needed on public route but just in case we need it
            // const { token } = JSON.parse(sessionData); 

            // Backend gets all by default up to limit (50)
            const response = await axios.get(`${API_BASE_URL}/api/reviews?limit=1000`);
            
            if (response.data.success) {
                const fetchedReviews = response.data.reviews || [];
                setReviews(fetchedReviews);
                
                // Calc stats
                if (fetchedReviews.length > 0) {
                    const totalRatings = fetchedReviews.reduce((sum, r) => sum + r.rating, 0);
                    setStats({
                        total: fetchedReviews.length,
                        avg: (totalRatings / fetchedReviews.length).toFixed(1)
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const displayedReviews = filterRating === 'All' 
        ? reviews 
        : reviews.filter(r => r.rating === parseInt(filterRating));

    return (
        <div className="p-6 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <span className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <FiStar size={24} className="fill-current" />
                        </span>
                        Customer Feedback
                    </h1>
                    <p className="text-slate-500 mt-2 ml-1">Review and manage customer ratings and comments</p>
                </div>
                
                {/* Stats Card */}
                {stats.total > 0 && (
                    <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Average</p>
                            <p className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                                {stats.avg} <FiStar className="fill-current" size={20} />
                            </p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-semibold mr-4">
                    <FiFilter /> Filter By Rating:
                </div>
                
                <button 
                    onClick={() => setFilterRating('All')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterRating === 'All' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    All Ratings
                </button>
                
                {[5, 4, 3, 2, 1].map(stars => (
                    <button 
                        key={stars}
                        onClick={() => setFilterRating(stars)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 transition-all ${filterRating === stars ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {stars} <FiStar className="fill-current" />
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
            ) : displayedReviews.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
                    <FiMessageSquare size={64} className="mx-auto text-slate-300 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No feedback found</h3>
                    <p className="text-slate-500">There are no reviews matching the selected filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedReviews.map(review => (
                        <div key={review._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <FiStar 
                                        key={star} 
                                        size={20} 
                                        className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                                    />
                                ))}
                            </div>
                            
                            {/* Comment */}
                            <p className="text-slate-700 italic mb-6 line-clamp-4 relative z-10 font-medium">
                                "{review.comment}"
                            </p>
                            
                            {/* User & Order Info */}
                            <div className="pt-4 border-t border-slate-100 mt-auto relative z-10 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                            <FiUser size={14} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{review.userName}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[120px]">{review.userEmail}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                        {review.orderId?.orderId || 'Order'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 text-right uppercase font-bold tracking-wider">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedbackList;
