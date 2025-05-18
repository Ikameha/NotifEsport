"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Bell,
  Filter,
  RotateCcw,
  Trophy,
  CalendarDays,
  GamepadIcon,
  TrophyIcon,
  Activity,
  Search,
  ListFilter,
  Grid3X3,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  CalendarIcon,
  Clock,
  Share2,
  Play,
  ExternalLink,
} from "lucide-react"
import Image from "next/image"

import {
  Game,
  League,
  MatchStatus,
  DateFilter,
  ViewMode,
  SortOption,
  TeamStats,
  Match,
} from "./types"
import { useCalendarData } from "./hooks/useCalendarData";
import { useGameLeagues } from './hooks/useGameLeagues';
import { SiLeagueoflegends, SiValorant, SiCounterstrike, SiDota2 } from "react-icons/si";
import { GiRocket } from "react-icons/gi";


// Données fictives pour les matchs
// Dans les données fictives, ajouter des URLs de streaming pour les matchs en direct
// const matchesData: Match[] = []; // This will be replaced by data from useCalendarData hook. The actual array below should be deleted.



export default function CalendarPage() {
  const { matches, isLoading, error } = useCalendarData();
  const [selectedGame, setSelectedGame] = useState<Game>("all");
  const { leagues: gameLeagues, isLoadingLeagues, leaguesError } = useGameLeagues(selectedGame);
  const [selectedLeague, setSelectedLeague] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<MatchStatus>("all")
  const [selectedDate, setSelectedDate] = useState<DateFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [notifications, setNotifications] = useState<number[]>([])
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([])
  const [notificationModal, setNotificationModal] = useState<number | null>(null)
  const [showTeamStats, setShowTeamStats] = useState<{ [key: number]: boolean }>({})
  const [sortBy, setSortBy] = useState<SortOption>("time")
  const [hoveredMatch, setHoveredMatch] = useState<number | null>(null)

  const availableLeagues = useMemo<{ name: string; slug: string }[]>(() => {
    if (selectedGame === "all") {
      return [{ name: "Toutes les ligues", slug: "all" }];
    }
    if (isLoadingLeagues) {
      return [{ name: "Chargement des ligues...", slug: "loading" }];
    }
    if (leaguesError) {
      return [{ name: "Erreur de chargement", slug: "error" }];
    }
    return [{ name: "Toutes les ligues", slug: "all" }, ...gameLeagues.map(league => ({ name: league.name, slug: league.slug }))];
  }, [selectedGame, gameLeagues, isLoadingLeagues, leaguesError]);

  useEffect(() => {
    if (selectedLeague === "all" && selectedGame !== "all") {
      // Si l'utilisateur a explicitement choisi "Toutes les ligues" pour un jeu spécifique,
      // on ne le change pas, même si gameLeagues est vide initialement (pendant le chargement ou en cas d'erreur).
      // Le filtrage des matchs gérera cela (aucun filtre de ligue spécifique ne sera appliqué).
      return;
    }

    // Si un jeu spécifique est sélectionné (pas "all") et que les ligues sont chargées
    if (selectedGame !== "all" && gameLeagues && gameLeagues.length > 0) {
      const currentLeagueSlugs = gameLeagues.map(l => l.slug);
      if (!currentLeagueSlugs.includes(selectedLeague) && selectedLeague !== "all") {
        setSelectedLeague("all");
      }
    } else if (selectedGame !== "all" && !isLoadingLeagues && (!gameLeagues || gameLeagues.length === 0)){
      // Si un jeu spécifique est sélectionné, que ce n'est plus en chargement, et qu'il n'y a pas de ligues (erreur ou vide)
      // alors on force "Toutes les ligues" pour éviter d'avoir une ligue sélectionnée qui n'a pas de sens.
      if (selectedLeague !== "all") {
         setSelectedLeague("all");
      }
    }
    // Ne pas réinitialiser selectedLeague si selectedGame devient "all", car "all" est toujours une option valide.
  }, [selectedGame, selectedLeague, gameLeagues, isLoadingLeagues]);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSelectedGame("all")
    setSelectedLeague("all")
    setSelectedStatus("all")
    setSelectedDate("all")
    setSearchQuery("")
  }

  // Gestion des notifications
  const toggleNotification = (matchId: number) => {
    setNotifications((prev) => (prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]))
  }

  const isNotificationSet = (matchId: number) => {
    return notifications.includes(matchId)
  }

  // Gestion des équipes favorites
  const toggleFavoriteTeam = (teamName: string) => {
    setFavoriteTeams((prev) =>
      prev.includes(teamName) ? prev.filter((name) => name !== teamName) : [...prev, teamName],
    )
  }

  const isTeamFavorite = (teamName: string) => {
    return favoriteTeams.includes(teamName)
  }

  // Gestion des statistiques d'équipe
  const toggleTeamStats = (matchId: number) => {
    setShowTeamStats((prev) => ({
      ...prev,
      [matchId]: !prev[matchId],
    }))
  }

  // Gestion du modal de notifications
  const openNotificationModal = (matchId: number) => {
    setNotificationModal(matchId)
  }

  const closeNotificationModal = () => {
    setNotificationModal(null)
  }

  // Fonction pour aller à aujourd'hui
  const goToToday = () => {
    setCurrentMonth(new Date())
    setCurrentWeek(new Date())
    setSelectedDate("today")
  }

  // Gestion du calendrier mensuel
  const getPrevMonth = () => {
    const prevMonth = new Date(currentMonth)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    setCurrentMonth(prevMonth)
  }

  const getNextMonth = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setCurrentMonth(nextMonth)
  }

  // Gestion du calendrier hebdomadaire
  const getPrevWeek = () => {
    const prevWeek = new Date(currentWeek)
    prevWeek.setDate(prevWeek.getDate() - 7)
    setCurrentWeek(prevWeek)
  }

  const getNextWeek = () => {
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setCurrentWeek(nextWeek)
  }

  const getWeekDays = () => {
    const startDay = new Date(currentWeek)
    // Trouver le lundi de la semaine
    const day = startDay.getDay() || 7 // 0 = dimanche, 1 = lundi, ..., 7 = dimanche
    startDay.setDate(startDay.getDate() - day + 1)
    startDay.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDay)
      date.setDate(startDay.getDate() + i)
      date.setHours(0, 0, 0, 0)
      days.push({
        date,
        dayName: date.toLocaleDateString("fr-FR", { weekday: "short" }),
        dayNumber: date.getDate(),
        isToday: isSameDay(date, new Date()),
      })
    }
    return days
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    // Ajustement pour commencer la semaine le lundi (0 = Lundi, 6 = Dimanche)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const days = []

    // Jours du mois précédent
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const prevMonthDate = new Date(year, month - 1, prevMonthDays - i)
      prevMonthDate.setHours(0, 0, 0, 0)
      days.push({
        day: prevMonthDays - i,
        currentMonth: false,
        date: prevMonthDate,
        isToday: isSameDay(prevMonthDate, new Date()),
      })
    }

    // Jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const currentMonthDate = new Date(year, month, i)
      currentMonthDate.setHours(0, 0, 0, 0)
      days.push({
        day: i,
        currentMonth: true,
        date: currentMonthDate,
        isToday: isSameDay(currentMonthDate, new Date()),
      })
    }

    // Jours du mois suivant
    const remainingDays = 42 - days.length // 6 semaines x 7 jours = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(year, month + 1, i)
      nextMonthDate.setHours(0, 0, 0, 0)
      days.push({
        day: i,
        currentMonth: false,
        date: nextMonthDate,
        isToday: isSameDay(nextMonthDate, new Date()),
      })
    }

    return days
  }

  const isSameDay = (date1: Date, date2: Date) => {
    if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
      console.error("Invalid date objects:", date1, date2)
      return false
    }

    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const getMatchesForDay = (date: Date) => {
    return filteredMatches.filter((match) => {
      return isSameDay(match.dateObj, date)
    })
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  const formatWeekRange = (date: Date) => {
    const startDay = new Date(date)
    const day = startDay.getDay() || 7 // 0 = dimanche, 1 = lundi, ..., 7 = dimanche
    startDay.setDate(startDay.getDate() - day + 1)

    const endDay = new Date(startDay)
    endDay.setDate(startDay.getDate() + 6)

return `${startDay.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${endDay.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
  }

  // Filtrer et trier les matchs
  const filteredMatches = useMemo(() => {
    // Gérer les états de chargement, d'erreur, ou si matches n'est pas encore défini
    if (isLoading || error || !matches) {
      return [];
    }
    return matches
      .filter((match: Match) => { 
        const gameMatch = selectedGame === "all" || match.game === selectedGame;
        const leagueMatch = selectedLeague === "all" || match.league_slug === selectedLeague;
        const statusMatch = selectedStatus === "all" || match.status === selectedStatus;

        // Favoris
        const favoriteMatch =
          favoriteTeams.length === 0 ||
          isTeamFavorite(match.team1.name) ||
          isTeamFavorite(match.team2.name);

        // Recherche par nom d'équipe
        const searchMatch =
          searchQuery === "" ||
          match.team1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.team2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.league.toLowerCase().includes(searchQuery.toLowerCase());

        // Filtre par date
        let dateMatch = true;
        if (selectedDate !== "all") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);

          const thisWeekStart = new Date(today);
          const dayOfWeek = today.getDay() || 7; 
          thisWeekStart.setDate(today.getDate() - dayOfWeek + 1); 

          const thisWeekEnd = new Date(thisWeekStart);
          thisWeekEnd.setDate(thisWeekStart.getDate() + 6); 

          const nextWeekStart = new Date(thisWeekStart);
          nextWeekStart.setDate(nextWeekStart.getDate() + 7); 

          const nextWeekEnd = new Date(nextWeekStart);
          nextWeekEnd.setDate(nextWeekStart.getDate() + 6); 

          const matchDateValue = new Date(match.dateObj); // Renommé pour éviter conflit avec dateMatch
          matchDateValue.setHours(0, 0, 0, 0);

          if (selectedDate === "today") {
            dateMatch = isSameDay(matchDateValue, today);
          } else if (selectedDate === "tomorrow") {
            dateMatch = isSameDay(matchDateValue, tomorrow);
          } else if (selectedDate === "thisWeek") {
            dateMatch = matchDateValue >= thisWeekStart && matchDateValue <= thisWeekEnd;
          } else if (selectedDate === "nextWeek") {
            dateMatch = matchDateValue >= nextWeekStart && matchDateValue <= nextWeekEnd;
          }
        }
        return gameMatch && leagueMatch && statusMatch && dateMatch && searchMatch && favoriteMatch;
      })
      .sort((a: Match, b: Match) => { 
        // Priorité aux matchs en direct
        if (a.status === "live" && b.status !== "live") return -1;
        if (a.status !== "live" && b.status === "live") return 1;

        // Tri selon l'option sélectionnée
        if (sortBy === "time") {
          // Ensure dateObj are valid Date objects before calling getTime
          const aDate = new Date(a.dateObj);
          const bDate = new Date(b.dateObj);
          if (aDate.getTime() !== bDate.getTime()) { 
            return aDate.getTime() - bDate.getTime();
          }
          return a.time.localeCompare(b.time);
        } else if (sortBy === "league") {
          return a.league.localeCompare(b.league);
        } else if (sortBy === "game") {
          return a.game.localeCompare(b.game);
        }
        return 0;
      });
  }, [selectedGame, selectedLeague, selectedStatus, selectedDate, searchQuery, favoriteTeams, sortBy, matches, isLoading, error]);

  // Grouper les matchs par jour
  const matchesByDay = useMemo(() => {
    if (!filteredMatches || filteredMatches.length === 0) {
      return {};
    }
    const grouped: { [key: string]: Match[] } = {};
    filteredMatches.forEach((match) => {
      const matchDate = new Date(match.dateObj); 
      if (isNaN(matchDate.getTime())) { 
        console.warn("Invalid date object for match:", match);
        return; 
      }
      const dateStr = matchDate.toISOString().split("T")[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(match);
    });
    return grouped;
  }, [filteredMatches]);
  // Compter les matchs par catégorie pour les badges
  const matchesForCounting = useMemo(() => {
    if (isLoading || error || !matches) {
      return [];
    }
    if (selectedGame === "all") {
      return matches;
    }
    return matches.filter(match => match.game === selectedGame);
  }, [matches, selectedGame, isLoading, error]);

  const matchCounts = useMemo(() => {
    if (isLoading || error || !matchesForCounting || matchesForCounting.length === 0) {
      return {
        all: 0,
        live: 0,
        upcoming: 0,
        completed: 0,
        today: 0,
        tomorrow: 0,
        thisWeek: 0,
        nextWeek: 0,
      };
    }

    const counts = {
      all: matchesForCounting.length,
      live: matchesForCounting.filter((m) => m.status === "live").length,
      upcoming: matchesForCounting.filter((m) => m.status === "upcoming").length,
      completed: matchesForCounting.filter((m) => m.status === "completed").length,
      today: 0,
      tomorrow: 0,
      thisWeek: 0,
      nextWeek: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(today.getDate() + 1);

    const thisWeekStart = new Date(today);
    const dayOfWeek = today.getDay() || 7; // 0 is Sunday, make it 7
    thisWeekStart.setDate(today.getDate() - dayOfWeek + 1); // Set to Monday
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Set to Sunday

    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    matchesForCounting.forEach((match) => {
      const matchDateVal = new Date(match.dateObj);
      matchDateVal.setHours(0, 0, 0, 0);

      if (isSameDay(matchDateVal, today)) counts.today++;
      if (isSameDay(matchDateVal, tomorrowDate)) counts.tomorrow++;
      if (matchDateVal >= thisWeekStart && matchDateVal <= thisWeekEnd) counts.thisWeek++;
      if (matchDateVal >= nextWeekStart && matchDateVal <= nextWeekEnd) counts.nextWeek++;
    });

    return counts;
  }, [isLoading, error, matchesForCounting]);

  console.log("[CalendarPage] Rendering state before JSX:", {
    selectedGame,
    selectedLeague,
    gameLeagues,
    isLoadingLeagues,
    leaguesError,
    availableLeagues,
    filteredMatchesLength: filteredMatches.length,
    matchCounts
  });

  const formatDayHeader = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00Z"); // Assurer l'interprétation en UTC pour éviter décalage de jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, tomorrow)) return "Demain";
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  const renderMatch = (match: Match, index: number) => (
    <div key={match.id || index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          {match.game === "lol" && <SiLeagueoflegends size={20} className="text-blue-500" />}
          {match.game === "valorant" && <SiValorant size={20} className="text-red-500" />}
          {match.game === "csgo" && <SiCounterstrike size={20} className="text-yellow-500" />}
          {match.game === "rl" && <GiRocket size={20} className="text-blue-400" />}
          {match.game === "dota2" && <SiDota2 size={20} className="text-red-600" />}
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{match.league}</span>
        </div>
        <span
          className={`px-2 py-1 text-xs font-bold rounded-full ${
            match.status === "live"
              ? "bg-red-500 text-white animate-pulse"
              : match.status === "upcoming"
              ? "bg-blue-500 text-white"
              : "bg-gray-500 text-white" // Pour 'completed'
          }`}
        >
          {match.status === "live" ? "En direct" : match.status === "upcoming" ? "À venir" : "Terminé"}
        </span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <img src={match.team1.logo || "/default-logo.png"} alt={match.team1.name} className="w-6 h-6 object-contain" />
          <span className="font-medium text-gray-800 dark:text-gray-100">{match.team1.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{match.team1.score !== null ? match.team1.score : "-"}</span>
        </div>
        <span className="text-gray-400 dark:text-gray-500">vs</span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{match.team2.score !== null ? match.team2.score : "-"}</span>
          <span className="font-medium text-gray-800 dark:text-gray-100">{match.team2.name}</span>
          <img src={match.team2.logo || "/default-logo.png"} alt={match.team2.name} className="w-6 h-6 object-contain" />
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {new Date(match.dateObj).toLocaleDateString("fr-FR", { // S'assurer que dateObj est un objet Date valide
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}{ " "}
        à {match.time}
      </div>
    </div>
  );

// Functions restored


if (isLoading) {
  return <div className="flex justify-center items-center h-screen">Chargement des matchs...</div>;
}

if (error) {
  return <div className="flex justify-center items-center h-screen text-red-500">Erreur: {typeof error === 'string' ? error : (error as Error)?.message || 'Une erreur est survenue lors du chargement des matchs.'}</div>;
}

if (!matches || matches.length === 0) {
  return <div className="flex justify-center items-center h-screen">Aucun match à afficher pour le moment.</div>;
}

return (
  <div className="container mx-auto px-4 py-8">
    {/* En-tête et contrôles */}
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      {/* Barre de recherche et sélection de vue */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* ... */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une équipe, une ligue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-forest/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark/50 hover:text-dark"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex bg-white shadow-sm rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2.5 flex items-center gap-1.5 font-medium ${
                viewMode === "list" ? "bg-forest text-white shadow-glow" : "bg-white text-dark hover:bg-forest/10"
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2.5 flex items-center gap-1.5 font-medium ${
                viewMode === "calendar" ? "bg-forest text-white shadow-glow" : "bg-white text-dark hover:bg-forest/10"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2.5 flex items-center gap-1.5 font-medium ${
                viewMode === "week" ? "bg-forest text-white shadow-glow" : "bg-white text-dark hover:bg-forest/10"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Semaine</span>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2.5 bg-forest text-white rounded-lg font-medium hover:opacity-90 transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            Aujourd'hui
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white border border-forest/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-forest" />
              <h2 className="font-semibold">Filtres</h2>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-forest/10 text-forest rounded-lg hover:bg-forest/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Sélection du jeu */}
            <div className="w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <GamepadIcon className="w-4 h-4 text-forest" />
                <h3 className="text-sm font-medium">Jeu</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGame("all")}
                  className={`filter-chip ${selectedGame === "all" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedGame("lol")}
                  className={`filter-chip ${selectedGame === "lol" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  <SiLeagueoflegends className="inline mr-1 mb-0.5" /> League of Legends ({(matches ? matches.filter(m => m.game === 'lol').length : 0)})
                </button>
                <button
                  onClick={() => setSelectedGame("valorant")}
                  className={`filter-chip ${selectedGame === "valorant" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  <SiValorant className="inline mr-1 mb-0.5" /> Valorant ({(matches ? matches.filter(m => m.game === 'valorant').length : 0)})
                </button>
                <button
                  onClick={() => setSelectedGame("rl")}
                  className={`filter-chip ${selectedGame === "rl" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  <GiRocket className="inline mr-1 mb-0.5" /> {/* Ajout de l'icône */}
                  Rocket League ({(matches ? matches.filter(m => m.game === 'rl').length : 0)})
                </button>
                <button
                  onClick={() => setSelectedGame("csgo")}
                  className={`filter-chip ${selectedGame === "csgo" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  <SiCounterstrike className="inline mr-1 mb-0.5" />
                  CS:GO ({(matches ? matches.filter(m => m.game === 'csgo').length : 0)})
                </button>
              </div>
            </div>

            {/* Sélection de la ligue */}
            <div className="w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <TrophyIcon className="w-4 h-4 text-forest" />
                <h3 className="text-sm font-medium">Ligue</h3>
              </div>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-forest/50"
              >
                {/* <option value="all">Toutes les ligues</option> a été déplacé dans availableLeagues et est géré dynamiquement */}
                { (isLoadingLeagues && selectedGame !== 'all') ? (
                  <option value="loading" disabled>Chargement des ligues...</option>
                ) : (leaguesError && selectedGame !== 'all') ? (
                  <option value="error" disabled>Erreur de chargement des ligues</option>
                ) : (
                  availableLeagues.map((league) => (
                    <option key={league.slug} value={league.slug}>
                      {league.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Sélection du statut */}
            <div className="w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-4 h-4 text-forest" />
                <h3 className="text-sm font-medium">Statut</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus("all")}
                  className={`filter-chip ${selectedStatus === "all" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedStatus("live")}
                  className={`filter-chip ${selectedStatus === "live" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  En direct ({matchCounts.live})
                </button>
                <button
                  onClick={() => setSelectedStatus("upcoming")}
                  className={`filter-chip ${selectedStatus === "upcoming" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  À venir ({matchCounts.upcoming})
                </button>
                <button
                  onClick={() => setSelectedStatus("completed")}
                  className={`filter-chip ${selectedStatus === "completed" ? "filter-chip-active" : "filter-chip-inactive"}`}
                >
                  Terminés ({matchCounts.completed})
                </button>
              </div>
            </div>

            {/* Sélection de la date */}
            <div className="w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarDays className="w-4 h-4 text-forest" />
                <h3 className="text-sm font-medium">Date</h3>
              </div>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value as DateFilter)}
                className="w-full px-4 py-2 rounded-lg border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-forest/50"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="tomorrow">Demain</option>
                <option value="thisWeek">Cette semaine</option>
                <option value="nextWeek">Semaine prochaine</option>
              </select>
            </div>

            {/* Autres filtres */}
            <div className="w-full">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-4 h-4 text-forest" />
                <h3 className="text-sm font-medium">Tri et options</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-4 py-2 rounded-lg border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-forest/50"
                >
                  <option value="time">Trier par date</option>
                  <option value="league">Trier par ligue</option>
                  <option value="game">Trier par jeu</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vue Liste */}
      {viewMode === "list" && (
        <div className="space-y-8">
          {Object.keys(matchesByDay).length === 0 ? (
            selectedGame === "rl" && !isLoading ? ( 
              <div className="text-center py-12 bg-white border border-forest/20 rounded-xl shadow-card">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-bold mb-2">Données Rocket League indisponibles</h3>
                <p className="text-dark/70">
                  Les matchs pour Rocket League ne sont pas disponibles actuellement via notre fournisseur de données.
                </p>
                <button
                  onClick={resetFilters} // Peut-être changer le texte du bouton ici aussi ou le comportement ?
                  className="mt-4 px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors"
                >
                  Voir les autres jeux
                </button>
              </div>
            ) : ( 
              <div className="text-center py-12 bg-white border border-forest/20 rounded-xl shadow-card">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">Aucun match trouvé</h3>
                <p className="text-dark/70">Aucun match ne correspond à vos critères de recherche.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )
          ) : (
            Object.keys(matchesByDay)
              .sort()
              .map((dateStr) => (
                <div key={dateStr} className="space-y-4">
                  <div className="sticky top-0 z-10 bg-light bg-opacity-80 backdrop-blur-sm py-2">
                    <h2 className="text-xl font-bold capitalize">{formatDayHeader(dateStr)}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchesByDay[dateStr].map((match, index) => renderMatch(match, index))}
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Vue Calendrier Mensuel */}
      {viewMode === "calendar" && (
        <div className="bg-white border border-forest/20 rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={getPrevMonth}
              className="p-2 text-dark/70 hover:text-dark hover:bg-forest/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">{formatMonth(currentMonth)}</h2>
            <button
              onClick={getNextMonth}
              className="p-2 text-dark/70 hover:text-dark hover:bg-forest/5 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center text-dark/70 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentMonth).map((day, index) => {
              const matchesOnDay = getMatchesForDay(day.date)
              const hasLiveMatches = matchesOnDay.some((m) => m.status === "live")
              console.log(`Jour ${day.day}, matchs:`, matchesOnDay.length)

              return (
                <div
                  key={index}
                  className={`min-h-[140px] calendar-cell ${
                    day.currentMonth
                      ? day.isToday
                        ? "calendar-cell-today"
                        : "calendar-cell-current"
                      : "calendar-cell-other"
                  } ${hasLiveMatches ? "animate-pulse-glow" : ""}`}
                >
                  <div
                    className={`text-right ${day.currentMonth ? "text-dark" : "text-dark/40"} p-2 font-medium ${day.isToday ? "bg-forest/10 rounded-t-lg" : ""}`}
                  >
                    {day.day}
                  </div>

                  <div className="overflow-y-auto max-h-[110px] p-1 space-y-1.5">
                    {matchesOnDay.length > 0 ? (
                      matchesOnDay.map((match) => (
                        // Modifier la fonction qui affiche les matchs dans la vue calendrier pour ajouter le lien de streaming
                        <div
                          key={match.id}
                          className={`calendar-match ${
                            match.status === "live"
                              ? "calendar-match-live"
                              : match.status === "completed"
                                ? "calendar-match-completed"
                                : "calendar-match-upcoming"
                          }`}
                          onClick={() => {
                            // Ouvrir un modal ou rediriger vers la page du match
                            if (match.status !== "completed") {
                              openNotificationModal(match.id)
                            }
                          }}
                        >
                          <div className="font-semibold flex items-center justify-between">
                            <span className="truncate max-w-[70%]">
                              {match.team1.name} vs {match.team2.name}
                            </span>
                            {match.status === "live" && (
                              <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium">{match.time}</span>
                            {(match.status === "live" || match.status === "completed") && (
                              <span className="font-medium">
                                {match.team1.score}-{match.team2.score}
                              </span>
                            )}
                          </div>
                          {match.status === "live" && match.streamUrl && (
                            <a
                              href={match.streamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs bg-danger text-white mt-1 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-danger/90 w-fit"
                            >
                              <Play className="w-2 h-2 fill-current" />
                              Live
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-dark/40 text-center py-4">Aucun match</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vue Calendrier Hebdomadaire */}
      {viewMode === "week" && (
        <div className="bg-white border border-forest/20 rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={getPrevWeek}
              className="p-2 text-dark/70 hover:text-dark hover:bg-forest/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">{formatWeekRange(currentWeek)}</h2>
            <button
              onClick={getNextWeek}
              className="p-2 text-dark/70 hover:text-dark hover:bg-forest/5 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {getWeekDays().map((day) => {
              const matchesOnDay = getMatchesForDay(day.date)
              const hasLiveMatches = matchesOnDay.some((m) => m.status === "live")

              return (
                <div key={day.dayNumber} className="flex flex-col">
                  <div
                    className={`text-center p-2 font-medium rounded-t-lg ${
                      day.isToday ? "bg-forest text-white" : "bg-forest/10 text-dark"
                    }`}
                  >
                    <div>{day.dayName}</div>
                    <div className="text-lg">{day.dayNumber}</div>
                  </div>

                  <div
                    className={`flex-1 border border-t-0 border-forest/20 rounded-b-lg p-2 min-h-[300px] overflow-y-auto ${
                      hasLiveMatches ? "animate-pulse-glow" : ""
                    }`}
                  >
                    {matchesOnDay.length > 0 ? (
                      <div className="space-y-2">
                        {matchesOnDay.map((match) => (
                          // Modifier la fonction qui affiche les matchs dans la vue semaine pour ajouter le lien de streaming
                          <div
                            key={match.id}
                            className={`p-2 rounded-lg text-sm border cursor-pointer ${
                              match.status === "live"
                                ? "border-l-4 border-danger bg-danger/5"
                                : match.status === "completed"
                                  ? "border-l-4 border-dark/30 bg-dark/5"
                                  : "border-l-4 border-forest bg-forest/5"
                            }`}
                            onClick={() => {
                              // Ouvrir un modal ou rediriger vers la page du match
                              if (match.status !== "completed") {
                                openNotificationModal(match.id)
                              }
                            }}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{match.time}</span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                  match.status === "live"
                                    ? "bg-danger/20 text-danger"
                                    : match.status === "upcoming"
                                      ? "bg-forest/20 text-forest"
                                      : "bg-dark/10 text-dark/70"
                                }`}
                              >
                                {match.status === "live"
                                  ? "EN DIRECT"
                                  : match.status === "upcoming"
                                    ? "À VENIR"
                                    : "TERMINÉ"}
                              </span>
                            </div>
                            <div className="font-medium">
                              {match.team1.name} vs {match.team2.name}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs text-dark/70 mt-1">
                                {match.league} • {match.game === "lol" ? "LoL" : "Valorant"}
                              </div>
                              {match.status === "live" && match.streamUrl && (
                                <a
                                  href={match.streamUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs bg-danger text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-danger/90"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  Regarder
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-dark/40 text-sm">Aucun match</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal de notification */}
      {notificationModal !== null && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-glow animate-float">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Configurer le rappel</h3>
              <button onClick={closeNotificationModal} className="text-dark/50 hover:text-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-dark/70 mb-4">Quand souhaitez-vous recevoir un rappel pour ce match ?</p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-forest/20 rounded-lg hover:bg-forest/5 cursor-pointer transition-colors">
                  <input type="radio" name="reminder" className="accent-forest w-4 h-4" defaultChecked />
                  <div>
                    <div className="font-medium">30 minutes avant</div>
                    <div className="text-xs text-dark/70">Soyez prêt juste avant le coup d'envoi</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-forest/20 rounded-lg hover:bg-forest/5 cursor-pointer transition-colors">
                  <input type="radio" name="reminder" className="accent-forest w-4 h-4" />
                  <div>
                    <div className="font-medium">1 heure avant</div>
                    <div className="text-xs text-dark/70">Préparez-vous à l'avance</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-forest/20 rounded-lg hover:bg-forest/5 cursor-pointer transition-colors">
                  <input type="radio" name="reminder" className="accent-forest w-4 h-4" />
                  <div>
                    <div className="font-medium">1 jour avant</div>
                    <div className="text-xs text-dark/70">Planifiez votre journée à l'avance</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={closeNotificationModal}
                className="px-4 py-2.5 border border-forest/20 rounded-lg hover:bg-forest/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  toggleNotification(notificationModal)
                  closeNotificationModal()
                }}
                className="px-4 py-2.5 bg-forest text-white rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {isNotificationSet(notificationModal) ? "Modifier le rappel" : "Activer le rappel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
