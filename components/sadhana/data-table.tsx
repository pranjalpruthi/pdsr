"use client";

import { useEffect, useState } from "react";
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
import { ArrowUpDown, ChevronDown, RefreshCw, Eye, QuoteIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
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

  const handleViewDetails = (record: SadhanaRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const columns: ColumnDef<SadhanaRecord>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          📅 Date <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
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
      cell: ({ row }) => {
        const score = row.getValue("total_score") as number;
        return (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Badge className={cn(
              "font-medium transition-colors",
              getScoreColors(score, true)
            )}>
              {score}
            </Badge>
          </motion.div>
        );
      },
    },
    {
      accessorKey: "total_rounds",
      header: "📿 Rounds",
      cell: ({ row }) => {
        const rounds = row.getValue("total_rounds") as number;
        return (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Badge className={cn(
              "font-medium transition-colors",
              getRoundsColors(rounds, true)
            )}>
              {rounds}
            </Badge>
          </motion.div>
        );
      },
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

  const refreshData = async (pageIndex = 0) => {
    setIsLoading(true);
    const startRange = pageIndex * PAGE_SIZE;
    const endRange = startRange + PAGE_SIZE - 1;

    try {
      const { data: sadhanaData, count, error } = await supabase
        .from('sadhna_report_view')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .range(startRange, endRange);

      if (sadhanaData && !error) {
        const formattedData = sadhanaData.map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString(),
        }));
        
        setData(formattedData);
        setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
        setPage(pageIndex);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      refreshData(newPage);
    }
  };

  useEffect(() => {
    refreshData(0);

    const channel = supabase
      .channel('sadhna_report_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sadhna_report',
        },
        () => {
          refreshData(0);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
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
              onClick={() => refreshData(0)}
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 pb-2">
            <Input
              placeholder="Filter by devotee..."
              value={(table.getColumn("devotee_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("devotee_name")?.setFilterValue(event.target.value)
              }
              className="w-full h-8 text-xs sm:max-w-xs"
              disabled={isLoading}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isLoading}>
                  Columns <ChevronDown className="ml-1 h-3 w-3" />
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
          <div className="mt-4 flex items-center justify-between">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-64" />
              </>
            ) : (
              <>
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
                    
                    {/* Show first page */}
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(0)}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Show ellipsis if needed */}
                    {page > 2 && (
                      <PaginationItem>
                        <PaginationLink>...</PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Show current page and neighbors */}
                    {Array.from({ length: 3 }, (_, i) => page + i - 1)
                      .filter(pageNum => pageNum >= 0 && pageNum < totalPages)
                      .map(pageNum => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === page}
                          >
                            {pageNum + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    {/* Show ellipsis if needed */}
                    {page < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationLink>...</PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Show last page */}
                    {page < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(totalPages - 1)}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0 gap-0 bg-background/80 backdrop-blur-md border border-muted">
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