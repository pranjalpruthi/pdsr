"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  Eye,
  QuoteIcon,
  Calendar,
  Search,
  Filter,
  BarChart2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface SadhanaRecord {
  date: string;
  report_id: number;
  devotee_name: string;
  devotee_id: number;
  total_score: number;
  before_7_am_japa_session: number;
  before_7_am: number;
  from_7_to_9_am: number;
  after_9_am: number;
  total_rounds: number;
  score_a: number;
  book_name: string;
  book_reading_time_min: number;
  score_b: number;
  lecture_speaker: string;
  lecture_time_min: number;
  score_c: number;
  seva_name: string;
  seva_time_min: number;
  score_d: number;
  formatted_monthly: string;
  formatted_weekly: string;
}

interface DevoteeRecord {
  devotee_name: string;
}

const getScoreColors = (score: number, isDark = false) => {
  if (score >= 90) return isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700";
  if (score >= 75) return isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700";
  if (score >= 60) return isDark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700";
  return isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700";
};

const getRoundsColors = (rounds: number, isDark = false) => {
  if (rounds >= 16) return isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700";
  if (rounds >= 12) return isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700";
  if (rounds >= 8) return isDark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-100 text-yellow-700";
  return isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700";
};

function TableSkeleton() {
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i} className="h-8">
          {[...Array(6)].map((_, j) => (
            <TableCell key={j} className="p-2">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function DetailsSkeletons() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-6 p-4">
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BlockQuote = ({
  quote,
  author = "Srila Prabhupada",
}: {
  quote: string;
  author?: string;
}) => {
  return (
    <blockquote className={cn(
      "rounded-xl border-l-4 px-4 py-3",
      "border-purple-500/70 bg-purple-500/15 text-purple-700",
      "dark:bg-purple-500/10 dark:text-purple-400",
      "transition-all duration-300"
    )}>
      <p className="inline italic text-sm">
        <QuoteIcon
          aria-hidden="true"
          className="-translate-y-1 mr-1 inline size-3 fill-purple-700 stroke-none dark:fill-purple-400"
        />
        {quote}
        <QuoteIcon
          aria-hidden="true"
          className="ml-1 inline size-3 translate-y-1 fill-purple-700 stroke-none dark:fill-purple-400"
        />
      </p>
      <p className="mt-1.5 text-end font-semibold text-xs italic tracking-tighter">
        {author}
      </p>
    </blockquote>
  );
};

const VANIQUOTES = [
  {
    quote: "One should chant the holy name of the Lord in a humble state of mind, thinking oneself lower than the straw in the street.",
    author: "Srila Prabhupada"
  },
  {
    quote: "The spiritual master opens the eyes of the blind man with the torch of knowledge.",
    author: "Srila Prabhupada"
  },
  {
    quote: "Krishna consciousness is not an artificial imposition on the mind; it is the original energy of the living entity.",
    author: "Srila Prabhupada"
  },
  // Add more quotes as needed
];

// New Statistics Interface
interface SadhanaStats {
  averageScore: number;
  averageRounds: number;
  totalSubmissions: number;
  topDevotees: Array<{ name: string; score: number }>;
}

const ScoreBadge = memo(({ score }: { score: number }) => (
  <Badge 
    className={cn(
      "font-medium select-none",
      getScoreColors(score, true)
    )}
  >
    {score}
  </Badge>
));

const RoundsBadge = memo(({ rounds }: { rounds: number }) => (
  <Badge 
    className={cn(
      "font-medium select-none",
      getRoundsColors(rounds, true)
    )}
  >
    {rounds}
  </Badge>
));

export function SadhanaDataTable() {
  const [data, setData] = useState<SadhanaRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const PAGE_SIZE = 10;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [selectedRecord, setSelectedRecord] = useState<SadhanaRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [randomQuote, setRandomQuote] = useState(VANIQUOTES[0]);
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [devotees, setDevotees] = useState<string[]>([]);
  const [selectedDevotee, setSelectedDevotee] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [stats, setStats] = useState<SadhanaStats | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Memoized Filters
  const filters = useMemo(() => ({
    highScorers: (record: SadhanaRecord) => record.total_score >= 90,
    lowRounds: (record: SadhanaRecord) => record.total_rounds < 16,
    earlyRisers: (record: SadhanaRecord) => record.before_7_am_japa_session > 0,
  }), []);

  // Calculate Statistics
  const calculateStats = useCallback((data: SadhanaRecord[]) => {
    const stats: SadhanaStats = {
      averageScore: 0,
      averageRounds: 0,
      totalSubmissions: data.length,
      topDevotees: []
    };

    if (data.length > 0) {
      stats.averageScore = data.reduce((acc, curr) => acc + curr.total_score, 0) / data.length;
      stats.averageRounds = data.reduce((acc, curr) => acc + curr.total_rounds, 0) / data.length;
      
      // Get top performers
      const devoteeScores = data.reduce((acc, curr) => {
        if (!acc[curr.devotee_name]) {
          acc[curr.devotee_name] = { total: 0, count: 0 };
        }
        acc[curr.devotee_name].total += curr.total_score;
        acc[curr.devotee_name].count++;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      stats.topDevotees = Object.entries(devoteeScores)
        .map(([name, { total, count }]) => ({
          name,
          score: total / count
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    }

    return stats;
  }, []);

  // Enhanced Data Fetching
  const fetchData = useCallback(async (
    pageIndex: number,
    filters: { week?: number, devotee?: string, search?: string }
  ) => {
    setIsLoading(true);
    const startRange = pageIndex * pageSize;
    const endRange = startRange + pageSize - 1;

    try {
      let query = supabase
        .from('sadhna_report_view')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.week) {
        const { start, end } = getWeekDates(filters.week, new Date().getFullYear());
        query = query
          .gte('date', start)
          .lte('date', end);
      }

      if (filters.devotee) {
        query = query.eq('devotee_name', filters.devotee);
      }

      if (filters.search) {
        query = query.ilike('devotee_name', `%${filters.search}%`);
      }

      // Apply pagination
      query = query
        .order('date', { ascending: false })
        .range(startRange, endRange);

      const { data: sadhanaData, count, error } = await query;

      if (error) throw error;

      if (sadhanaData) {
        setData(sadhanaData.map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString()
        })));
        setTotalPages(Math.ceil((count || 0) / pageSize));
        setPage(pageIndex);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Enhanced UI Components
  const StatisticCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) => (
    <div className="rounded-lg border p-4 flex items-center space-x-4">
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  // Statistics Dashboard
  const StatisticsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatisticCard
        title="Average Score"
        value={stats?.averageScore.toFixed(1) || 0}
        icon={BarChart2}
      />
      <StatisticCard
        title="Average Rounds"
        value={stats?.averageRounds.toFixed(1) || 0}
        icon={RefreshCw}
      />
      <StatisticCard
        title="Total Submissions"
        value={stats?.totalSubmissions || 0}
        icon={Calendar}
      />
      <StatisticCard
        title="Active Filters"
        value={activeFilters.length}
        icon={Filter}
      />
    </div>
  );

  // Enhanced Search and Filter Bar
  const SearchAndFilterBar = () => {
    const { start, end } = getWeekDates(selectedWeek, new Date().getFullYear());
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    return (
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devotees or books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Week {selectedWeek}: </span>
              <span className="ml-1 text-muted-foreground">
                {format(startDate, 'dd MMM')} - {format(endDate, 'dd MMM')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  const weekNum = getWeekNumber(date);
                  setSelectedWeek(weekNum);
                  fetchData(0, {
                    week: weekNum,
                    devotee: selectedDevotee,
                    search: debouncedSearch
                  });
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters ({activeFilters.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {Object.entries(filters).map(([key, filter]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={activeFilters.includes(key)}
                onCheckedChange={(checked) => {
                  setActiveFilters(prev =>
                    checked
                      ? [...prev, key]
                      : prev.filter(f => f !== key)
                  );
                }}
              >
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Effect for search and filters
  useEffect(() => {
    fetchData(page, {
      week: selectedWeek,
      devotee: selectedDevotee,
      search: debouncedSearch
    });
  }, [debouncedSearch, selectedWeek, selectedDevotee, page, fetchData]);

  const handleViewDetails = (record: SadhanaRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<SadhanaRecord>[] = [
    {
      accessorKey: "date",
      header: "📅 Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "report_id",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          🏷️ Report ID <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          #{row.getValue("report_id")}
        </Badge>
      ),
    },
    {
      accessorKey: "devotee_name",
      header: "👤 Name",
      cell: ({ row }) => (
        <span className="font-medium">
          {row.getValue("devotee_name")}
        </span>
      ),
    },
    {
      accessorKey: "total_score",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          🎯 Score <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <ScoreBadge score={row.getValue("total_score")} />
    },
    {
      accessorKey: "total_rounds",
      header: "📿 Rounds",
      cell: ({ row }) => <RoundsBadge rounds={row.getValue("total_rounds")} />
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary/5"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </motion.div>
      ),
    },
  ];

  const fetchDevotees = async () => {
    const { data, error } = await supabase
      .from('sadhna_report_view')
      .select('devotee_name')
      .order('devotee_name');

    if (data && !error) {
      const uniqueDevotees = Array.from(new Set(data.map(d => d.devotee_name)));
      setDevotees(uniqueDevotees);
    }
  };

  useEffect(() => {
    fetchDevotees();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchData(newPage, {
        week: selectedWeek,
        devotee: selectedDevotee,
        search: debouncedSearch
      });
    }
  };

  useEffect(() => {
    const currentWeek = getWeekNumber(new Date());
    const weeks = Array.from({ length: currentWeek }, (_, i) => currentWeek - i);
    setAvailableWeeks(weeks);
  }, []);

  useEffect(() => {
    // Set a random quote on component mount
    const randomIndex = Math.floor(Math.random() * VANIQUOTES.length);
    setRandomQuote(VANIQUOTES[randomIndex]);
  }, []);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      columnVisibility: {
        devotee_id: false,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  function getWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7; // Adjust day number to make Monday = 0
    target.setDate(target.getDate() - dayNumber + 3); // Adjust to nearest Thursday
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  function getWeekDates(weekNumber: number, year: number) {
    // Create date from year and week number
    const firstDayOfWeek = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    
    // Adjust to the nearest Monday (ISO week starts on Monday)
    while (firstDayOfWeek.getDay() !== 1) {
      firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 1);
    }

    // Calculate the end of the week (Sunday)
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

    // Format dates to YYYY-MM-DD
    return {
      start: firstDayOfWeek.toISOString().split('T')[0],
      end: lastDayOfWeek.toISOString().split('T')[0]
    };
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col space-y-2 p-4">
          <CardTitle className="text-sm font-medium">
            <span className="flex items-center gap-2">
              📊 Recent Submissions
              {isLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
            </span>
          </CardTitle>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BlockQuote 
              quote={randomQuote.quote} 
              author={randomQuote.author} 
            />
          </motion.div>
          
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => fetchData(0, {
                week: selectedWeek,
                devotee: selectedDevotee,
                search: debouncedSearch
              })}
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <Select
                value={selectedDevotee || "all"}
                onValueChange={(value) => {
                  const devotee = value === "all" ? "" : value;
                  setSelectedDevotee(devotee);
                  table.getColumn("devotee_name")?.setFilterValue(devotee);
                  fetchData(0, {
                    week: selectedWeek,
                    devotee: devotee,
                    search: debouncedSearch
                  });
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="👤 Select devotee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devotees</SelectItem>
                  {devotees.map((devotee, index) => (
                    <SelectItem key={`${devotee}-${index}`} value={devotee}>
                      {devotee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedWeek.toString()}
                onValueChange={(value) => {
                  const weekNum = parseInt(value);
                  setSelectedWeek(weekNum);
                  fetchData(0, {
                    week: weekNum,
                    devotee: selectedDevotee,
                    search: debouncedSearch
                  });
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="📅 Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Weeks</SelectItem>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  const newSize = parseInt(value);
                  setPageSize(newSize);
                  fetchData(0, {
                    week: selectedWeek,
                    devotee: selectedDevotee,
                    search: debouncedSearch
                  });
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="📊 Records per page" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-8 text-xs justify-between" 
                    disabled={isLoading}
                  >
                    <span>👁️ Columns</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className="h-7 px-2 text-xs font-medium"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="h-8">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id} 
                          className="p-2 text-xs"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-16 text-center text-xs"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {table.getFilteredRowModel().rows.length} records
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(page - 1)}
                    className={cn(
                      "cursor-pointer",
                      page === 0 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>{page + 1}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(page + 1)}
                    className={cn(
                      "cursor-pointer",
                      page === totalPages - 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full max-h-[80vh]"
          >
            <DialogHeader className="px-4 py-3 border-b shrink-0">
              <DialogTitle>Sadhana Report Details</DialogTitle>
              {isLoading ? (
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ) : selectedRecord && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mt-2 grid grid-cols-2 gap-4 text-sm text-muted-foreground"
                >
                  <div>
                    <span className="font-medium">Devotee:</span> {selectedRecord.devotee_name}
                    <br />
                    <span className="font-medium">Report ID:</span> #{selectedRecord.report_id}
                  </div>
                  <div>
                    <span className="font-medium">Total Score:</span> {selectedRecord.total_score}
                    <br />
                    <span className="font-medium">Total Rounds:</span> {selectedRecord.total_rounds}
                  </div>
                </motion.div>
              )}
            </DialogHeader>

            {isLoading ? (
              <DetailsSkeletons />
            ) : selectedRecord && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 grid grid-cols-2 gap-6 p-4"
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-lg border p-4"
                  >
                    <h3 className="mb-3 font-semibold text-primary">Japa Schedule</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Before 7 AM (Japa):</span>
                        <span className="font-medium">{selectedRecord.before_7_am_japa_session}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Before 7 AM:</span>
                        <span className="font-medium">{selectedRecord.before_7_am}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>7-9 AM:</span>
                        <span className="font-medium">{selectedRecord.from_7_to_9_am}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After 9 AM:</span>
                        <span className="font-medium">{selectedRecord.after_9_am}</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2 font-medium text-primary">
                        <span>Score A:</span>
                        <span>{selectedRecord.score_a}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-lg border p-4"
                  >
                    <h3 className="mb-3 font-semibold text-primary">Book Reading</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Book:</span>
                        <span className="font-medium">{selectedRecord.book_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading Time:</span>
                        <span className="font-medium">{selectedRecord.book_reading_time_min} min</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2 font-medium text-primary">
                        <span>Score B:</span>
                        <span>{selectedRecord.score_b}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-lg border p-4"
                  >
                    <h3 className="mb-3 font-semibold text-primary">Lecture</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Speaker:</span>
                        <span className="font-medium">{selectedRecord.lecture_speaker}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{selectedRecord.lecture_time_min} min</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2 font-medium text-primary">
                        <span>Score C:</span>
                        <span>{selectedRecord.score_c}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-lg border p-4"
                  >
                    <h3 className="mb-3 font-semibold text-primary">Seva</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-medium">{selectedRecord.seva_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{selectedRecord.seva_time_min} min</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t pt-2 font-medium text-primary">
                        <span>Score D:</span>
                        <span>{selectedRecord.score_d}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
