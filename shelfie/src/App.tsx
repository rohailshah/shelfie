import React, { useState } from 'react';
import { 
  Tv, Film, BookOpen, Flame, Check, Plus, Search, 
  BarChart2, User, Trash2, ChevronRight, 
  CheckCircle2, X, Sparkles, Bookmark, LayoutGrid, List,
  Calendar, Star, Filter, Heart, Clock, ArrowUpRight
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync state to local storage
  React.useEffect(() => {
    localStorage.setItem('shelfie_items', JSON.stringify(items));
  }, [items]);

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
      case 'tv': return <Tv className="w-4 h-4 text-amber-400" />;
      case 'movie': return <Film className="w-4 h-4 text-violet-400" />;
      case 'comic': return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'anime': return <Flame className="w-4 h-4 text-rose-400" />;
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white flex flex-col items-center justify-start pb-16">
      
      {/* DESKTOP & MOBILE RESPONSIVE WRAPPER */}
      <div className="w-full max-w-6xl min-h-screen bg-[#0f1523] lg:my-6 lg:rounded-3xl lg:border lg:border-slate-800/80 lg:shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* TOP HEADER */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0f1523]/90 backdrop-blur-xl z-30 border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                  Shelfie
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  BINGERS STYLE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Track comics, movies, tv & anime per episode/issue with pleasant dark mode</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#161d30] p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${activeTab === 'home' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Flame className="w-4 h-4" />
              <span>Watch Next</span>
            </button>
            <button 
              onClick={() => setActiveTab('shelf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${activeTab === 'shelf' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Full Shelf</span>
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Stats</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveTab('search')}
              className="w-10 h-10 rounded-2xl bg-[#161d30] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#1e2740] transition"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Title</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-6 lg:p-8 pb-28 md:pb-12">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Hero Banner Feature */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-[#161d30] group cursor-pointer"
                   onClick={() => setSelectedItem(items[0])}>
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition duration-500">
                  <img src={items[0]?.coverImage} alt={items[0]?.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0f1523] via-[#0f1523]/80 to-transparent" />
                </div>
                <div className="relative z-10 p-6 lg:p-10 flex flex-col justify-center min-h-[280px] max-w-xl">
                  <div className="flex items-center space-x-2.5 mb-3">
                    <span className="px-3 py-1 rounded-lg bg-indigo-500 text-white font-extrabold text-[11px] tracking-wider uppercase shadow">
                      Up Next
                    </span>
                    <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-700/50">
                      {getMediaIcon(items[0]?.type)} {getTypeLabel(items[0]?.type)}
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 leading-tight drop-shadow-md">
                    {items[0]?.title}
                  </h2>
                  <p className="text-sm text-slate-300 line-clamp-2 mb-6 font-normal">
                    {items[0]?.synopsis}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 backdrop-blur-md border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black text-sm">
                        S3 E3
                      </div>
                      <div>
                        <div className="text-xs text-indigo-400 font-bold">Episode 3 of 26</div>
                        <div className="text-xs text-slate-300">Rhaenyra Triumphant</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleQuickCompleteNext(items[0].id, e)}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 flex items-center space-x-2 transition"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Mark Watched</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Watch Next List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                    <Flame className="w-5 h-5 text-indigo-400" /> Continue Watching & Reading
                  </h3>
                  <button onClick={() => setActiveTab('shelf')} className="text-xs text-indigo-400 hover:underline font-bold">
                    View Full Shelf ({items.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.filter(i => i.status === 'watching').map((item) => {
                    const nextEp = item.episodes.find(ep => !ep.watched) || item.episodes[item.episodes.length - 1];
                    const percent = Math.round((item.episodes.filter(e => e.watched).length / (item.totalProgress || 1)) * 100);

                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#161d30] hover:bg-[#1a233c] border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-4 transition cursor-pointer group shadow-lg"
                      >
                        <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-800 shadow">
                          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <div className="absolute top-1 left-1 bg-black/60 p-1 rounded-md backdrop-blur-sm">
                            {getMediaIcon(item.type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {item.unitName} {nextEp.number} / {item.totalProgress || '?'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate mb-0.5 group-hover:text-indigo-400 transition">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate font-medium">
                            {nextEp.title}
                          </p>

                          <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleQuickCompleteNext(item.id, e)}
                          className="w-10 h-10 rounded-full border border-slate-700 bg-[#1e2740] hover:bg-indigo-600 hover:border-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition shadow shrink-0"
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
                <h3 className="text-sm font-bold text-slate-300 mb-3 tracking-wide uppercase">Explore Collections</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div 
                    onClick={() => { setFilterType('tv'); setActiveTab('shelf'); }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition group"
                  >
                    <Tv className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition" />
                    <div className="font-bold text-white text-sm">TV Shows</div>
                    <div className="text-xs text-slate-400">{items.filter(i => i.type === 'tv').length} series logged</div>
                  </div>
                  <div 
                    onClick={() => { setFilterType('comic'); setActiveTab('shelf'); }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 cursor-pointer hover:border-cyan-500/40 transition group"
                  >
                    <BookOpen className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition" />
                    <div className="font-bold text-white text-sm">Comics & Books</div>
                    <div className="text-xs text-slate-400">{items.filter(i => i.type === 'comic').length} issues logged</div>
                  </div>
                  <div 
                    onClick={() => { setFilterType('anime'); setActiveTab('shelf'); }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 cursor-pointer hover:border-rose-500/40 transition group"
                  >
                    <Flame className="w-6 h-6 text-rose-400 mb-2 group-hover:scale-110 transition" />
                    <div className="font-bold text-white text-sm">Anime & Manga</div>
                    <div className="text-xs text-slate-400">{items.filter(i => i.type === 'anime').length} series logged</div>
                  </div>
                  <div 
                    onClick={() => { setFilterType('movie'); setActiveTab('shelf'); }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition group"
                  >
                    <Film className="w-6 h-6 text-violet-400 mb-2 group-hover:scale-110 transition" />
                    <div className="font-bold text-white text-sm">Movies</div>
                    <div className="text-xs text-slate-400">{items.filter(i => i.type === 'movie').length} films logged</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SHELF */}
          {activeTab === 'shelf' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Your Full Shelf</h2>
                  <p className="text-xs text-slate-400">Managing all your tracked comics, movies, shows, and anime</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex bg-[#161d30] border border-slate-800 rounded-xl p-1">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg text-xs font-bold transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg text-xs font-bold transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {(['all', 'tv', 'movie', 'comic', 'anime'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      filterType === type 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                        : 'bg-[#161d30] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {type === 'all' ? 'All Media' : getTypeLabel(type)}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex space-x-2">
                {(['all', 'watching', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl capitalize transition ${
                      filterStatus === status 
                        ? 'bg-slate-200 text-slate-900 font-bold' 
                        : 'bg-[#161d30] text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                  {filteredItems.map(item => {
                    const watchedCount = item.episodes.filter(e => e.watched).length;
                    const pct = Math.round((watchedCount / (item.totalProgress || 1)) * 100);

                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#161d30] border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-indigo-500/50 transition cursor-pointer flex flex-col group"
                      >
                        <div className="relative h-52 w-full bg-slate-950 overflow-hidden">
                          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#161d30] via-transparent to-transparent opacity-80" />
                          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center space-x-1.5 border border-white/10 text-[10px] font-bold text-white">
                            {getMediaIcon(item.type)}
                            <span className="capitalize">{item.type}</span>
                          </div>
                          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-indigo-600/90 text-white text-[10px] font-extrabold shadow">
                            ★ {item.rating}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-white truncate mb-1 group-hover:text-indigo-400 transition">
                              {item.title}
                            </h4>
                            <div className="text-[11px] text-slate-400 font-medium mb-3">
                              {watchedCount} / {item.totalProgress || '?'} {item.unitName}s
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                              <span>Progress</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3 pt-2">
                  {filteredItems.map(item => {
                    const watchedCount = item.episodes.filter(e => e.watched).length;
                    const pct = Math.round((watchedCount / (item.totalProgress || 1)) * 100);

                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-[#161d30] border border-slate-800 rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:border-indigo-500/50 transition group"
                      >
                        <img src={item.coverImage} alt={item.title} className="w-14 h-18 object-cover rounded-xl shadow shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 text-[10px] font-bold text-indigo-400 uppercase mb-1">
                            {getMediaIcon(item.type)}
                            <span>{getTypeLabel(item.type)}</span>
                            <span>•</span>
                            <span>{item.releaseYear}</span>
                          </div>
                          <h4 className="text-base font-bold text-white truncate group-hover:text-indigo-400 transition">{item.title}</h4>
                          <p className="text-xs text-slate-400 truncate">{item.genres.join(', ')}</p>
                        </div>

                        <div className="hidden sm:block w-32">
                          <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
                            <span>{watchedCount}/{item.totalProgress}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredItems.length === 0 && (
                <div className="text-center py-20 bg-[#161d30] rounded-3xl border border-slate-800 mt-4">
                  <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No media found</h3>
                  <p className="text-xs text-slate-400 mb-4">Try changing filters or add a new title to your shelf.</p>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                  >
                    Add Title Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Your Tracking Analytics</h2>
                <p className="text-xs text-slate-400">Pleasant and comprehensive overview of your entertainment habits</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#161d30] border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                  <div>
                    <div className="text-3xl font-black text-white mb-1">{totalWatchedEpisodes}</div>
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Episodes & Issues Logged</div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                </div>

                <div className="bg-[#161d30] border border-slate-800 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                  <div>
                    <div className="text-3xl font-black text-white mb-1">{totalCompletedShows}</div>
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fully Completed Series & Films</div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <BarChart2 className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="bg-[#161d30] border border-slate-800 p-6 rounded-3xl space-y-5 shadow-lg">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Format Distribution</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-2"><Tv className="w-4 h-4 text-amber-400" /> TV Shows</span>
                      <span className="text-slate-400">{items.filter(i => i.type === 'tv').length} titles</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'tv').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-400" /> Comics & Books</span>
                      <span className="text-slate-400">{items.filter(i => i.type === 'comic').length} titles</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'comic').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-rose-400" /> Anime & Manga</span>
                      <span className="text-slate-400">{items.filter(i => i.type === 'anime').length} titles</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'anime').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-2"><Film className="w-4 h-4 text-violet-400" /> Movies</span>
                      <span className="text-slate-400">{items.filter(i => i.type === 'movie').length} titles</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${(items.filter(i => i.type === 'movie').length / (items.length || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn max-w-xl mx-auto">
              <div className="flex items-center space-x-5 bg-[#161d30] p-6 rounded-3xl border border-slate-800 shadow-lg">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                  RS
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Rohail Shah</h3>
                  <p className="text-xs text-indigo-400 font-bold">Shelfie Pro Collector</p>
                  <a href="https://github.com/rohailshah/shelfie" target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-white mt-1 flex items-center gap-1 underline">
                    github.com/rohailshah/shelfie <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="bg-[#161d30] border border-slate-800 p-6 rounded-3xl space-y-4 shadow-lg">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Repository & Sync</h4>
                <p className="text-xs text-slate-300">Your Shelfie app is fully published and synced to your GitHub profile repository.</p>
                
                <div className="p-4 rounded-2xl bg-[#0f1523] border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
                  <div>git remote -v</div>
                  <div className="text-indigo-400">origin https://github.com/rohailshah/shelfie.git (push)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-4 animate-fadeIn max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search titles, genres, comics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#161d30] border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                />
              </div>

              <div className="space-y-3 pt-2">
                {items.filter(item => searchQuery.trim() === '' || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setSelectedItem(item); setActiveTab('shelf'); }}
                    className="bg-[#161d30] border border-slate-800 p-4 rounded-2xl flex items-center space-x-4 cursor-pointer hover:border-indigo-500/50 transition shadow-md"
                  >
                    <img src={item.coverImage} alt={item.title} className="w-14 h-16 object-cover rounded-xl shadow" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase">
                        {getMediaIcon(item.type)}
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{item.releaseYear}</span>
                      </div>
                      <h4 className="text-base font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{item.genres.join(', ')}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* MOBILE BOTTOM FLOATING NAVIGATION BAR */}
        <nav className="md:hidden absolute bottom-4 left-4 right-4 bg-[#161d30]/95 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl z-30">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'home' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-bold">Watch</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('shelf')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'shelf' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-bold">Shelf</span>
          </button>

          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'stats' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Stats</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'profile' ? 'text-indigo-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </nav>

        {/* DETAIL MODAL (Per Episode/Issue Checklist) */}
        {selectedItem && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-6 animate-fadeIn">
            <div className="bg-[#121826] border border-slate-800 rounded-t-3xl lg:rounded-3xl max-h-[90vh] w-full lg:max-w-2xl flex flex-col shadow-2xl overflow-hidden">
              
              {/* Modal Banner */}
              <div className="relative h-56 w-full shrink-0">
                <img src={selectedItem.coverImage} alt={selectedItem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121826] via-[#121826]/50 to-transparent" />
                
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black transition"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        {getTypeLabel(selectedItem.type)}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">{selectedItem.releaseYear}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedItem.title}</h2>
                  </div>
                  <button 
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition border border-rose-500/30"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Checklist */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Synopsis</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{selectedItem.synopsis}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedItem.genres.map(g => (
                    <span key={g} className="px-3 py-1 rounded-xl bg-[#1a233c] border border-slate-800 text-xs text-slate-300 font-medium">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Per Episode / Issue Checklist */}
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
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          ep.watched 
                            ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                            : 'bg-[#161d30] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            ep.watched ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {ep.number}
                          </div>
                          <div>
                            <div className="text-xs font-bold">{ep.title}</div>
                            {ep.watchedAt && <div className="text-[10px] text-indigo-400">Logged on {ep.watchedAt}</div>}
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                          ep.watched ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 bg-transparent'
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
            <div className="bg-[#121826] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">Add New Title</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Title Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Cyberpunk Edgerunners"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Media Type</label>
                    <select 
                      value={newType}
                      onChange={e => setNewType(e.target.value as MediaType)}
                      className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="tv">TV Show</option>
                      <option value="movie">Movie</option>
                      <option value="comic">Comic / Book</option>
                      <option value="anime">Anime / Manga</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Total Units</label>
                    <input 
                      type="number"
                      min={1}
                      value={newTotal}
                      onChange={e => setNewTotal(Number(e.target.value))}
                      className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Cover Image URL</label>
                  <input 
                    type="url"
                    value={newCover}
                    onChange={e => setNewCover(e.target.value)}
                    className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Release Year</label>
                    <input 
                      type="number"
                      value={newYear}
                      onChange={e => setNewYear(Number(e.target.value))}
                      className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Genres (comma sep)</label>
                    <input 
                      type="text"
                      value={newGenres}
                      onChange={e => setNewGenres(e.target.value)}
                      className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Synopsis</label>
                  <textarea 
                    rows={3}
                    value={newSynopsis}
                    onChange={e => setNewSynopsis(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full bg-[#161d30] border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:opacity-95 transition"
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
