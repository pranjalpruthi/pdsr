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
import { ArrowUpDown, ChevronDown, RefreshCw } from "lucide-react";
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
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

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

const columns: ColumnDef<SadhanaRecord>[] = [
  {
    accessorKey: "report_id",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        ID <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
  },
  {
    accessorKey: "devotee_name",
    header: "Name",
  },
  {
    accessorKey: "total_score",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Score <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-xs">{row.getValue("total_score")}</span>
    ),
  },
  {
    accessorKey: "before_7_am_japa_session",
    header: "Before 7 AM (Japa)",
  },
  {
    accessorKey: "before_7_am",
    header: "Before 7 AM",
  },
  {
    accessorKey: "from_7_to_9_am",
    header: "7-9 AM",
  },
  {
    accessorKey: "after_9_am",
    header: "After 9 AM",
  },
  {
    accessorKey: "total_rounds",
    header: "Total Rounds",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("total_rounds")}</span>
    ),
  },
  {
    accessorKey: "score_a",
    header: "Score A",
  },
  {
    accessorKey: "book_name",
    header: "Book",
  },
  {
    accessorKey: "book_reading_time_min",
    header: "Reading (min)",
  },
  {
    accessorKey: "score_b",
    header: "Score B",
  },
  {
    accessorKey: "lecture_speaker",
    header: "Speaker",
  },
  {
    accessorKey: "lecture_time_min",
    header: "Lecture (min)",
  },
  {
    accessorKey: "score_c",
    header: "Score C",
  },
  {
    accessorKey: "seva_name",
    header: "Seva",
  },
  {
    accessorKey: "seva_time_min",
    header: "Seva (min)",
  },
  {
    accessorKey: "score_d",
    header: "Score D",
  },
  {
    accessorKey: "formatted_weekly",
    header: "Week",
  },
];

export function SadhanaDataTable() {
  const [data, setData] = useState<SadhanaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const PAGE_SIZE = 9;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const refreshData = async (reset = false) => {
    if (!hasMore && !reset) return;
    
    setIsLoading(true);
    const startRange = reset ? 0 : page * PAGE_SIZE;
    const endRange = startRange + PAGE_SIZE - 1;

    const { data: sadhanaData, error } = await supabase
      .from('sadhna_report_view')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(startRange, endRange);

    if (sadhanaData && !error) {
      const formattedData = sadhanaData.map(record => ({
        ...record,
        date: new Date(record.date).toLocaleDateString(),
      }));
      
      setData(prev => reset ? formattedData : [...prev, ...formattedData]);
      setHasMore(sadhanaData.length === PAGE_SIZE);
      setPage(prev => reset ? 1 : prev + 1);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData(true);

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
          refreshData(true);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (inView && !isLoading) {
      refreshData();
    }
  }, [inView]);

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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="text-sm font-medium">📊 Recent Submissions</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => refreshData(true)}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
        </Button>
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
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
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
              {table.getRowModel().rows?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => (
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
                  ))}
                  {hasMore && (
                    <TableRow ref={ref}>
                      <TableCell colSpan={columns.length} className="h-16">
                        <div className="flex items-center justify-center">
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <p>{table.getFilteredRowModel().rows.length} records</p>
          {hasMore && !isLoading && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refreshData()}
              className="h-7 text-xs"
            >
              Load more
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}