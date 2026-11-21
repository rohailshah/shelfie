import React, { useState } from 'react';
import { 
  Tv, Film, BookOpen, Flame, Check, Plus, Search, 
  BarChart2, User, Trash2, ChevronRight, 
  CheckCircle2, X, Sparkles, Bookmark
} from 'lucide-react';
import { MediaItem, MediaType, MediaStatus } from './types';
import { INITIAL_ITEMS } from './types';

export function App() {
  const [items, setItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('shelfie_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'shelf' | 'stats' | 'profile' | 'search'>('home');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MediaStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync state to local storage
  React.useEffect(() => {
    localStorage.setItem('shelfie_items', JSON.stringify(items));
  }, [items]);

  // Quick toggle next episode / issue / chapter
  const handleQuickCompleteNext = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const nextUnwatchedIndex = item.episodes.findIndex(ep => !ep.watched);
      if (nextUnwatchedIndex === -1) return item;

      const updatedEpisodes = [...item.episodes];
      updatedEpisodes[nextUnwatchedIndex] = {
        ...updatedEpisodes[nextUnwatchedIndex],
        watched: true,
        watchedAt: new Date().toISOString().split('T')[0]
      };

      const newCurrentProgress = updatedEpisodes.filter(ep => ep.watched).length;
      const isNowCompleted = newCurrentProgress >= item.totalProgress && item.totalProgress > 0;

      return {
        ...item,
        currentProgress: newCurrentProgress,
        status: isNowCompleted ? 'completed' : item.status,
        episodes: updatedEpisodes,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const handleToggleEpisode = (itemId: string, episodeNumber: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updatedEpisodes = item.episodes.map(ep => {
        if (ep.number === episodeNumber) {
          const willWatch = !ep.watched;
          return {
            ...ep,
            watched: willWatch,
            watchedAt: willWatch ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return ep;
      });

      const newCurrentProgress = updatedEpisodes.filter(ep => ep.watched).length;
      const isNowCompleted = newCurrentProgress >= item.totalProgress && item.totalProgress > 0;

      return {
        ...item,
        currentProgress: newCurrentProgress,
        status: isNowCompleted ? 'completed' : item.status,
        episodes: updatedEpisodes,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }));

    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem(prev => {
        if (!prev) return null;
        const updatedEpisodes = prev.episodes.map(ep => {
          if (ep.number === episodeNumber) {
            const willWatch = !ep.watched;
            return {
              ...ep,
              watched: willWatch,
              watchedAt: willWatch ? new Date().toISOString().split('T')[0] : undefined
            };
          }
          return ep;
        });
        const newCurrentProgress = updatedEpisodes.filter(ep => ep.watched).length;
        return {
          ...prev,
          currentProgress: newCurrentProgress,
          episodes: updatedEpisodes
        };
      });
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setSelectedItem(null);
  };

  // Add Item State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MediaType>('tv');
  const [newTotal, setNewTotal] = useState(12);
  const [newCover, setNewCover] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newYear, setNewYear] = useState(2026);
  const [newGenres, setNewGenres] = useState('Action, Sci-Fi');

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let unitName: 'Episode' | 'Issue' | 'Chapter' | 'Movie' = 'Episode';
    if (newType === 'comic') unitName = 'Issue';
    if (newType === 'anime') unitName = 'Episode';
    if (newType === 'movie') unitName = 'Movie';

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      status: 'watching',
      currentProgress: 0,
      totalProgress: newTotal,
      coverImage: newCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
      synopsis: newSynopsis || 'No synopsis provided.',
      releaseYear: Number(newYear),
      genres: newGenres.split(',').map(g => g.trim()).filter(Boolean),
      unitName,
      rating: 5.0,
      lastUpdated: new Date().toISOString().split('T')[0],
      episodes: Array.from({ length: newTotal }, (_, i) => ({
        number: i + 1,
        title: `${unitName} ${i + 1}`,
        watched: false
      }))
    };

    setItems([newItem, ...items]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewSynopsis('');
  };

  // Stats calculations
  const totalWatchedEpisodes = items.reduce((acc, item) => acc + item.episodes.filter(ep => ep.watched).length, 0);
  const totalCompletedShows = items.filter(item => item.status === 'completed').length;

  const filteredItems = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'tv': return <Tv className="w-4 h-4 text-orange-400" />;
      case 'movie': return <Film className="w-4 h-4 text-purple-400" />;
      case 'comic': return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'anime': return <Flame className="w-4 h-4 text-red-400" />;
    }
  };

  const getTypeLabel = (type: MediaType) => {
    switch (type) {
      case 'tv': return 'TV Show';
      case 'movie': return 'Movie';
      case 'comic': return 'Comic';
      case 'anime': return 'Anime';
    }
  };

  return (
    <div className="min-h-screen bg-[#121214] text-gray-100 font-sans antialiased pb-28 selection:bg-orange-500 selection:text-white">
      {/* Mobile Device Container Preview Frame */}
      <div className="max-w-md mx-auto min-h-screen bg-[#161619] shadow-2xl relative flex flex-col border-x border-gray-800">
        
        {/* Top Header */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-[#161619]/90 backdrop-blur-md z-30 border-b border-gray-800/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-purple-600">
                shelfie
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Track comics, movies, tv & anime with style 😍</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab('search')}
              className="w-10 h-10 rounded-full bg-[#222226] border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#2c2c32] transition"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-105 transition"
              title="Add New Media"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Areas */}
        <main className="flex-1 px-4 py-4">
          
          {/* TAB 1: HOME (Watch Next / Continue Stream) */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Hero Banner / Highlight Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-[#1a1a1e] group cursor-pointer"
                   onClick={() => setSelectedItem(items[0])}>
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition duration-500">
                  <img src={items[0]?.coverImage} alt={items[0]?.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161619] via-[#161619]/60 to-transparent" />
                </div>
                <div className="relative z-10 p-6 flex flex-col justify-end min-h-[220px]">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2.5 py-1 rounded-md bg-orange-500 text-white font-bold text-[10px] tracking-wider uppercase shadow">
                      Up Next
                    </span>
                    <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                      {getMediaIcon(items[0]?.type)} {getTypeLabel(items[0]?.type)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-1 leading-tight drop-shadow">
                    {items[0]?.title}
                  </h2>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-4 font-normal">
                    {items[0]?.synopsis}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-sm">
                        S03E03
                      </div>
                      <div>
                        <div className="text-xs text-orange-400 font-semibold">Episode 3 of 26</div>
                        <div className="text-xs text-gray-400">Rhaenyra Triumphant</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleQuickCompleteNext(items[0].id, e)}
                      className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/40 flex items-center space-x-1.5 transition"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Watched</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Watch Next List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" /> Continue Watching & Reading
                  </h3>
                  <button onClick={() => setActiveTab('shelf')} className="text-xs text-orange-400 hover:underline font-semibold">
                    View All ({items.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {items.filter(i => i.status === 'watching').map((item) => {
                    const nextEp = item.episodes.find(ep => !ep.watched) || item.episodes[item.episodes.length - 1];
                    const percent = Math.round((item.episodes.filter(e => e.watched).length / (item.totalProgress || 1)) * 100);

                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#202024] hover:bg-[#27272c] border border-gray-800/80 rounded-2xl p-3 flex items-center space-x-4 transition cursor-pointer group shadow-md"
                      >
                        <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-800 shadow">
                          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <div className="absolute top-1 left-1">
                            {getMediaIcon(item.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {item.unitName} {nextEp.number} / {item.totalProgress || '?'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate mb-0.5 group-hover:text-orange-400 transition">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-400 truncate font-medium">
                            {nextEp.title}
                          </p>

                          {/* Mini Progress Bar */}
                          <div className="mt-2 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleQuickCompleteNext(item.id, e)}
                          className="w-10 h-10 rounded-full border border-gray-700 bg-[#2a2a30] hover:bg-orange-500 hover:border-orange-500 text-gray-300 hover:text-white flex items-center justify-center transition shadow shrink-0"
                          title="Mark next as watched"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Categories Bar */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-gray-300 mb-3 tracking-wide uppercase">Explore Collections</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => { setFilterType('tv'); setActiveTab('shelf'); }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 cursor-pointer hover:border-orange-500/40 transition"
                  >
                    <Tv className="w-6 h-6 text-orange-400 mb-2" />
                    <div className="font-bold text-white text-sm">TV Shows</div>
                    <div className="text-xs text-gray-400">{items.filter(i => i.type === 'tv').length} series logged</div>
                  </div>
                  <div 
                    onClick={() => { setFilterType('comic'); setActiveTab('shelf'); }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition"
                  >
                    <BookOpen className="w-6 h-6 text-blue-400 mb-2" />
                    <div className="font-bold text-white text-sm">Comics & Books</div>
                    <div className="text-xs text-gray-400">{items.filter(i => i.type === 'comic').length} issues logged</div>
                  </div>
                  <div 
                    onClick={() => { setFilterType('anime'); setActiveTab('shelf'); }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 cursor-pointer hover:border-red-500/40 transition"
                  >
                    <Flame className="w-6 h-6 text-red-400 mb-2" />
                    <div className="font-bold text-white text-sm">Anime & Manga</div>
                    <div className="text-xs text-gray-400">{items.filter(i => i.type === 'anime').length} series logged</div>
                  </div>
                  <div 
                    onClick={() => { setFilterType('movie'); setActiveTab('shelf'); }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 cursor-pointer hover:border-purple-500/40 transition"
                  >
                    <Film className="w-6 h-6 text-purple-400 mb-2" />
                    <div className="font-bold text-white text-sm">Movies</div>
                    <div className="text-xs text-gray-400">{items.filter(i => i.type === 'movie').length} films logged</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SHELF (Full Media Vault) */}
          {activeTab === 'shelf' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">Your Shelf</h2>
                <span className="text-xs px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg font-bold">
                  {filteredItems.length} items
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {(['all', 'tv', 'movie', 'comic', 'anime'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      filterType === type 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                        : 'bg-[#202024] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {type === 'all' ? 'All Media' : getTypeLabel(type)}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex space-x-2 pb-1">
                {(['all', 'watching', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`text-[11px] font-semibold px-3 py-1 rounded-lg capitalize transition ${
                      filterStatus === status 
                        ? 'bg-gray-200 text-gray-900 font-bold' 
                        : 'bg-[#1e1e22] text-gray-400 hover:text-gray-200 border border-gray-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Grid of Items */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {filteredItems.map(item => {
                  const watchedCount = item.episodes.filter(e => e.watched).length;
                  const pct = Math.round((watchedCount / (item.totalProgress || 1)) * 100);

                  return (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-[#202024] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-orange-500/50 transition cursor-pointer flex flex-col group"
                    >
                      <div className="relative h-44 w-full bg-gray-900 overflow-hidden">
                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#202024] via-transparent to-transparent opacity-80" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md flex items-center space-x-1 border border-white/10 text-[10px] font-bold text-white">
                          {getMediaIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-orange-500/90 text-white text-[10px] font-extrabold shadow">
                          ★ {item.rating}
                        </div>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white truncate mb-1 group-hover:text-orange-400 transition">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-gray-400 font-medium mb-3">
                            {watchedCount} / {item.totalProgress || '?'} {item.unitName}s
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 font-semibold">
                            <span>Progress</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-16 bg-[#202024] rounded-3xl border border-gray-800 mt-4">
                  <Bookmark className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No media found</h3>
                  <p className="text-xs text-gray-400 mb-4">Try changing filters or add a new title to your shelf.</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/30"
                  >
                    Add Title Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STATS (Tracking Insights) */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-white mb-1">Your Tracking Stats</h2>
                <p className="text-xs text-gray-400">Detailed analytics of your entertainment habits</p>
              </div>

              {/* Big Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#202024] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{totalWatchedEpisodes}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-0.5">Episodes / Issues Logged</div>
                  </div>
                </div>

                <div className="bg-[#202024] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{totalCompletedShows}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-0.5">Completed Series</div>
                  </div>
                </div>
              </div>

              {/* Breakdown by Media Type */}
              <div className="bg-[#202024] border border-gray-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Media Breakdown</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5"><Tv className="w-4 h-4 text-orange-400" /> TV Shows</span>
                      <span className="text-gray-400">{items.filter(i => i.type === 'tv').length} titles</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'tv').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-400" /> Comics & Books</span>
                      <span className="text-gray-400">{items.filter(i => i.type === 'comic').length} titles</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'comic').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-red-400" /> Anime & Manga</span>
                      <span className="text-gray-400">{items.filter(i => i.type === 'anime').length} titles</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'anime').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5"><Film className="w-4 h-4 text-purple-400" /> Movies</span>
                      <span className="text-gray-400">{items.filter(i => i.type === 'movie').length} titles</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'movie').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievement Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-rose-500/20 to-purple-500/20 border border-orange-500/30 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Binge Master Supreme</h4>
                  <p className="text-xs text-gray-300 font-medium">Logged over {totalWatchedEpisodes} items across all formats. Incredible dedication!</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & GITHUB SYNC */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center space-x-4 bg-[#202024] p-5 rounded-3xl border border-gray-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  RS
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Rohail Shah</h3>
                  <p className="text-xs text-orange-400 font-semibold">Shelfie Pro Collector</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">github.com/rohailshah</p>
                </div>
              </div>

              {/* GitHub Push Integration Card */}
              <div className="bg-[#202024] border border-gray-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-white font-bold">
                    GH
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">GitHub Repository Sync</h4>
                    <p className="text-xs text-gray-400">Push Shelfie app codebase to your profile</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 text-xs font-mono text-gray-300 space-y-2">
                  <div>git remote add origin https://github.com/rohailshah/shelfie.git</div>
                  <div>git push -u origin main</div>
                </div>

                <button 
                  onClick={() => alert('Shelfie repository is fully prepared and ready for push to https://github.com/rohailshah/shelfie ! Run `git push` in your terminal.')}
                  className="w-full py-3 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition shadow flex items-center justify-center space-x-2"
                >
                  <span>Push to Rohail's GitHub</span>
                </button>
              </div>

              {/* App Preferences */}
              <div className="bg-[#202024] border border-gray-800 p-5 rounded-3xl space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Shelfie Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">Dark Mode Theme</span>
                    <span className="text-orange-400 font-bold">Bingers Dark</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">Auto-Sync Cloud Backup</span>
                    <span className="text-green-400 font-bold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">Tracked Formats</span>
                    <span className="text-gray-300 font-bold">TV, Movie, Comic, Anime</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search titles, genres, comics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#202024] border border-gray-700 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
                />
              </div>

              <div className="space-y-3 pt-2">
                {items.filter(item => searchQuery.trim() === '' || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setSelectedItem(item); setActiveTab('shelf'); }}
                    className="bg-[#202024] border border-gray-800 p-3 rounded-2xl flex items-center space-x-3 cursor-pointer hover:border-orange-500/50 transition"
                  >
                    <img src={item.coverImage} alt={item.title} className="w-12 h-14 object-cover rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase">
                        {getMediaIcon(item.type)}
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.releaseYear}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-gray-400 truncate">{item.genres.join(', ')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* BOTTOM FLOATING NAVIGATION BAR */}
        <nav className="absolute bottom-4 left-4 right-4 bg-[#1f1f23]/95 backdrop-blur-xl border border-gray-800/80 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl z-30">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'home' ? 'text-orange-500 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-bold">Watch</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('shelf')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'shelf' ? 'text-orange-500 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-bold">Shelf</span>
          </button>

          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'stats' ? 'text-orange-500 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Stats</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'profile' ? 'text-orange-500 scale-105' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </nav>

        {/* DETAIL MODAL (Per Episode/Issue/Chapter checklist) */}
        {selectedItem && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end animate-fadeIn">
            <div className="bg-[#18181c] border-t border-gray-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              
              {/* Modal Banner Header */}
              <div className="relative h-48 w-full shrink-0">
                <img src={selectedItem.coverImage} alt={selectedItem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#18181c] via-[#18181c]/60 to-transparent" />
                
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black transition"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider">
                        {getTypeLabel(selectedItem.type)}
                      </span>
                      <span className="text-xs text-gray-300 font-semibold">{selectedItem.releaseYear}</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{selectedItem.title}</h2>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition border border-red-500/30"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Episodes list */}
              <div className="p-5 overflow-y-auto space-y-6 flex-1">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Synopsis</h4>
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">{selectedItem.synopsis}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.genres.map(g => (
                    <span key={g} className="px-2.5 py-1 rounded-lg bg-[#242429] border border-gray-800 text-[11px] text-gray-300 font-medium">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Per Episode / Issue / Chapter Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Track {selectedItem.unitName}s ({selectedItem.episodes.filter(e => e.watched).length}/{selectedItem.totalProgress || selectedItem.episodes.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {selectedItem.episodes.map(ep => (
                      <div 
                        key={ep.number}
                        onClick={() => handleToggleEpisode(selectedItem.id, ep.number)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          ep.watched 
                            ? 'bg-orange-500/10 border-orange-500/30 text-white' 
                            : 'bg-[#202024] border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            ep.watched ? 'bg-orange-500 text-white shadow' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {ep.number}
                          </div>
                          <div>
                            <div className="text-xs font-bold">{ep.title}</div>
                            {ep.watchedAt && <div className="text-[10px] text-orange-400">Logged on {ep.watchedAt}</div>}
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                          ep.watched ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-600 bg-transparent'
                        }`}>
                          {ep.watched && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ADD MEDIA MODAL */}
        {isAddModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#18181c] border border-gray-800 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Add to Shelfie</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1 block">Title Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cyberpunk Edgerunners"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">Media Type</label>
                    <select 
                      value={newType}
                      onChange={e => setNewType(e.target.value as MediaType)}
                      className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="tv">TV Show</option>
                      <option value="movie">Movie</option>
                      <option value="comic">Comic / Book</option>
                      <option value="anime">Anime / Manga</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">Total Units</label>
                    <input 
                      type="number"
                      min={1}
                      value={newTotal}
                      onChange={e => setNewTotal(Number(e.target.value))}
                      className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1 block">Cover Image URL</label>
                  <input 
                    type="url"
                    value={newCover}
                    onChange={e => setNewCover(e.target.value)}
                    className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">Release Year</label>
                    <input 
                      type="number"
                      value={newYear}
                      onChange={e => setNewYear(Number(e.target.value))}
                      className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 mb-1 block">Genres (comma sep)</label>
                    <input 
                      type="text"
                      value={newGenres}
                      onChange={e => setNewGenres(e.target.value)}
                      className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1 block">Synopsis</label>
                  <textarea 
                    rows={3}
                    value={newSynopsis}
                    onChange={e => setNewSynopsis(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full bg-[#222227] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-xs shadow-lg shadow-orange-500/30 hover:opacity-90 transition"
                >
                  Add Title to Shelfie
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
