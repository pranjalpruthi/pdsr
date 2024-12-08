"use client";

import { useState, useEffect, useCallback } from "react";
import { PasswordCheck } from "@/components/auth/password-check";
import ReactECharts from 'echarts-for-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import * as echarts from 'echarts/core';
import { GraphicComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Users, Plus, UserMinus, UserCog } from "lucide-react";

echarts.use([GraphicComponent, CanvasRenderer]);

// Add these interfaces at the top of the file
interface ChartData {
  top10: [string, number][];
  monthlyAvg: { month: string; average: number }[];
}

interface Report {
  report_id: string;
  date: string;
  devotee_id: string;
  devotee_name: string;
  total_score: number;
}

interface SupabaseReport {
  report_id: string;
  date: string;
  devotee_id: string;
  total_score: number;
  devotees: {
    devotee_name: string;
  };
}

// Add this interface near the top with other interfaces
interface DeleteReportDialogProps {
  reportId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

// Add this component before ManageSection
function DeleteReportDialog({ reportId, isOpen, onOpenChange, onConfirm }: DeleteReportDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete report #{reportId}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Add this interface
interface TableRowActionProps {
  isDeleting: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

// Add this component before ManageSection
function TableRowAction({ isDeleting, onDelete, onCancel }: TableRowActionProps) {
  return (
    <div className="flex items-center gap-2">
      {isDeleting ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 px-2 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-900/50"
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 px-2 text-muted-foreground"
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Add these interfaces
interface DevoteeNameBadgeProps {
  name: string;
  onRemove: () => void;
}

function DevoteeNameBadge({ name, onRemove }: DevoteeNameBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
        {name}
        <X 
          className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
          onClick={onRemove}
        />
      </Badge>
    </motion.div>
  );
}

export function ManageSection() {
  const router = useRouter();
  const [devotees, setDevotees] = useState<Array<{ devotee_id: string; devotee_name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newDevoteeName, setNewDevoteeName] = useState("");
  const [selectedDevotee, setSelectedDevotee] = useState("");
  const [newName, setNewName] = useState("");
  const [reportId, setReportId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [chartData, setChartData] = useState<ChartData>({ 
    top10: [], 
    monthlyAvg: [] 
  });
  const [devoteeNames, setDevoteeNames] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successDetails, setSuccessDetails] = useState<string>("");
  const [deleteReportId, setDeleteReportId] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [reportIdToRemove, setReportIdToRemove] = useState("");

  // Memoize the individual load functions
  const loadDevotees = useCallback(async () => {
    const { data, error } = await supabase
      .from('devotees')
      .select('devotee_id, devotee_name');
    
    if (data && !error) {
      setDevotees(data);
    }
  }, []);

  const loadRecentReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('sadhna_report')
      .select(`
        report_id,
        date,
        devotee_id,
        devotees (
          devotee_name
        ),
        total_score
      `)
      .order('date', { ascending: false })
      .limit(10);

    if (data && !error) {
      const transformedData: Report[] = (data as unknown as SupabaseReport[]).map(report => ({
        report_id: report.report_id,
        date: report.date,
        devotee_id: report.devotee_id,
        devotee_name: report.devotees?.devotee_name || 'Unknown',
        total_score: report.total_score
      }));
      setRecentReports(transformedData);
    }
  }, []);

  const loadChartData = useCallback(async () => {
    const { data: reportData, error } = await supabase
      .from('sadhna_report')
      .select(`
        report_id,
        date,
        devotee_id,
        total_score,
        devotees (
          devotee_name
        )
      `);

    if (reportData && !error) {
      // Type assertion with unknown first
      const typedReportData = reportData as unknown as SupabaseReport[];
      
      // Calculate top 10 devotees
      const devoteeScores: Record<string, number> = {};
      typedReportData.forEach(report => {
        const devoteeName = report.devotees?.devotee_name;
        if (devoteeName) {
          devoteeScores[devoteeName] = (devoteeScores[devoteeName] || 0) + report.total_score;
        }
      });

      // Convert to array and sort for top 10
      const top10 = Object.entries(devoteeScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      // Calculate monthly averages
      const monthlyData: Record<string, { total: number; count: number }> = {};
      typedReportData.forEach(report => {
        if (!report.date) return;
        
        const date = new Date(report.date);
        const month = date.toLocaleString('default', { 
          month: 'long',
          year: 'numeric'
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, count: 0 };
        }
        monthlyData[month].total += report.total_score;
        monthlyData[month].count += 1;
      });

      // Sort months chronologically
      const monthlyAvg = Object.entries(monthlyData)
        .map(([month, { total, count }]) => ({
          month,
          average: Math.round(total / count)
        }))
        .sort((a, b) => {
          const [monthA, yearA] = a.month.split(' ');
          const [monthB, yearB] = b.month.split(' ');
          const dateA = new Date(`${monthA} 1, ${yearA}`);
          const dateB = new Date(`${monthB} 1, ${yearB}`);
          return dateA.getTime() - dateB.getTime();
        });

      setChartData({ top10, monthlyAvg });
    }
  }, []);

  // Memoize the main loadData function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDevotees(),
        loadRecentReports(),
        loadChartData()
      ]);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [loadDevotees, loadRecentReports, loadChartData]);

  // Update useEffect to include memoized loadData
  useEffect(() => {
    loadDevotees();
  }, [loadDevotees]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Function to handle adding a name to the list
  const handleAddName = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      e.preventDefault();
      setDevoteeNames([...devoteeNames, currentInput.trim()]);
      setCurrentInput("");
    }
  };

  // Function to remove a name from the list
  const removeName = (nameToRemove: string) => {
    setDevoteeNames(devoteeNames.filter(name => name !== nameToRemove));
  };

  // Modified addDevotee function to handle multiple names
  async function addDevotee() {
    if (devoteeNames.length === 0) {
      toast.error("Please add at least one devotee name");
      return;
    }

    setIsLoading(true);
    toast.promise(
      async () => {
        const { error } = await supabase
          .from('devotees')
          .insert(devoteeNames.map(name => ({ devotee_name: name })));

        if (error) throw error;

        setDevoteeNames([]);
        await loadDevotees();
        router.refresh();
      },
      {
        loading: 'Adding devotees...',
        success: `Successfully added ${devoteeNames.length} devotee${devoteeNames.length > 1 ? 's' : ''}! 🙏`,
        error: 'Failed to add devotees'
      }
    );
    setIsLoading(false);
  }

  async function removeDevotee() {
    if (!selectedDevotee) {
      toast.error("Please select a devotee");
      return;
    }

    const selectedDevorteeName = devotees.find(d => d.devotee_id === selectedDevotee)?.devotee_name;

    setIsLoading(true);
    try {
      // First, delete all reports for this devotee
      const { error: reportsError } = await supabase
        .from('sadhna_report')
        .delete()
        .eq('devotee_id', selectedDevotee);

      if (reportsError) throw reportsError;

      // Then delete the devotee
      const { error: devoteeError } = await supabase
        .from('devotees')
        .delete()
        .eq('devotee_id', selectedDevotee);

      if (devoteeError) throw devoteeError;

      showSuccess(
        "Devotee Removed Successfully",
        `${selectedDevorteeName} and all associated reports have been permanently removed from the system.`
      );
      
      setSelectedDevotee("");
      await loadDevotees();
      await loadChartData();
      router.refresh();
    } catch (error) {
      toast.error("Failed to remove devotee");
    } finally {
      setIsLoading(false);
    }
  }

  async function renameDevotee() {
    if (!selectedDevotee || !newName.trim()) {
      toast.error("Please select a devotee and enter a new name");
      return;
    }

    const oldName = devotees.find(d => d.devotee_id === selectedDevotee)?.devotee_name;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('devotees')
        .update({ devotee_name: newName })
        .eq('devotee_id', selectedDevotee);

      if (error) throw error;

      showSuccess(
        "Devotee Renamed Successfully",
        `Devotee name has been updated from "${oldName}" to "${newName}".`
      );
      
      setSelectedDevotee("");
      setNewName("");
      await loadDevotees();
      router.refresh();
    } catch (error) {
      toast.error("Failed to rename devotee");
    } finally {
      setIsLoading(false);
    }
  }

  async function removeReport(reportId: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sadhna_report')
        .delete()
        .eq('report_id', reportId);

      if (error) throw error;

      toast.success("Report deleted successfully");
      await loadRecentReports();
      await loadChartData();
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete report");
    } finally {
      setIsLoading(false);
      setDeletingReportId(null);
    }
  }

  const top10ChartOption = {
    title: {
      text: 'Top 10 Devotees by Total Score',
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.top10.map(([name]) => name),
      axisLabel: {
        rotate: 30,
        interval: 0,
        overflow: 'break'
      }
    },
    yAxis: {
      type: 'value',
      name: 'Total Score'
    },
    series: [{
      name: 'Total Score',
      data: chartData.top10.map(([, score]) => score),
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#6d28d9' }
          ]
        }
      },
      emphasis: {
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#a78bfa' },
              { offset: 1, color: '#7c3aed' }
            ]
          }
        }
      },
      label: {
        show: true,
        position: 'top',
        textStyle: {
          color: '#888',
          fontSize: 12
        }
      }
    }]
  };

  const monthlyChartOption = {
    title: { 
      text: 'Average Score by Month',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: { 
      type: 'category',
      data: chartData.monthlyAvg.map(d => d.month),
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: { 
      type: 'value',
      name: 'Average Score'
    },
    series: [{
      data: chartData.monthlyAvg.map(d => d.average),
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 3,
        color: '#8b5cf6'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(139, 92, 246, 0.5)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#8b5cf6',
        borderWidth: 2
      },
      emphasis: {
        scale: true,
        focus: 'series'
      },
      symbol: 'circle',
      symbolSize: 8
    }]
  };

  // Add refresh function
  async function refreshRecentReports() {
    setIsLoading(true);
    toast.promise(
      loadRecentReports(),
      {
        loading: 'Refreshing reports...',
        success: 'Reports refreshed successfully',
        error: 'Failed to refresh reports'
      }
    );
    setIsLoading(false);
  }

  // Enhanced success handler
  const showSuccess = (message: string, details?: string) => {
    // Show immediate toast feedback
    toast.success(message, {
      description: details,
      action: {
        label: "View",
        onClick: () => setShowSuccessDialog(true)
      }
    });

    // Set dialog content
    setSuccessMessage(message);
    setSuccessDetails(details || "");
    setShowSuccessDialog(true);
  };

  // Enhanced Success Dialog component
  const SuccessDialog = () => (
    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Success
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <span className="block font-medium text-base text-foreground">
                {successMessage}
              </span>
              {successDetails && (
                <span className="block text-sm text-muted-foreground">
                  {successDetails}
                </span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:space-x-2">
          <AlertDialogAction 
            onClick={() => {
              setShowSuccessDialog(false);
              loadData(); // Refresh data after action
            }}
          >
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (!isAuthenticated) {
    return <PasswordCheck onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="space-y-8">
      {/* Add Success Dialog */}
      <SuccessDialog />

      {/* Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Devotee Management
          </CardTitle>
          <CardDescription>
            Add, remove, or rename devotees in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add
              </TabsTrigger>
              <TabsTrigger value="remove" className="flex items-center gap-2">
                <UserMinus className="h-4 w-4" />
                Remove
              </TabsTrigger>
              <TabsTrigger value="rename" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                Rename
              </TabsTrigger>
            </TabsList>

            {/* Add Devotees Tab */}
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="devotee-name">Devotee Names</Label>
                  <div className="flex gap-2">
                    <Input
                      id="devotee-name"
                      placeholder="Type devotee name and press Enter"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={handleAddName}
                      disabled={isLoading}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => {
                        if (currentInput.trim()) {
                          setDevoteeNames([...devoteeNames, currentInput.trim()]);
                          setCurrentInput("");
                        }
                      }}
                      disabled={!currentInput.trim() || isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="min-h-[100px] p-4 border rounded-lg bg-muted/50">
                  <AnimatePresence>
                    {devoteeNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {devoteeNames.map((name, index) => (
                          <DevoteeNameBadge
                            key={index}
                            name={name}
                            onRemove={() => removeName(name)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Enter devotee names above
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <Button 
                  onClick={addDevotee} 
                  disabled={isLoading || devoteeNames.length === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Devotees...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {devoteeNames.length} Devotee{devoteeNames.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Remove Devotee Tab */}
            <TabsContent value="remove" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="remove-devotee">Select Devotee</Label>
                  <Select onValueChange={setSelectedDevotee} value={selectedDevotee}>
                    <SelectTrigger id="remove-devotee">
                      <SelectValue placeholder="Choose a devotee to remove" />
                    </SelectTrigger>
                    <SelectContent>
                      {devotees.map((devotee) => (
                        <SelectItem key={devotee.devotee_id} value={devotee.devotee_id}>
                          {devotee.devotee_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDevotee && (
                  <Card className="border-destructive">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Warning
                      </CardTitle>
                      <CardDescription>
                        This will permanently delete the devotee and all their associated reports.
                        This action cannot be undone.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <Button 
                  variant="destructive" 
                  onClick={removeDevotee} 
                  disabled={isLoading || !selectedDevotee}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing Devotee...
                    </>
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove Devotee
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Rename Devotee Tab */}
            <TabsContent value="rename" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rename-devotee">Select Devotee</Label>
                  <Select onValueChange={setSelectedDevotee} value={selectedDevotee}>
                    <SelectTrigger id="rename-devotee">
                      <SelectValue placeholder="Choose a devotee to rename" />
                    </SelectTrigger>
                    <SelectContent>
                      {devotees.map((devotee) => (
                        <SelectItem key={devotee.devotee_id} value={devotee.devotee_id}>
                          {devotee.devotee_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDevotee && (
                  <div className="space-y-2">
                    <Label htmlFor="new-name">New Name</Label>
                    <Input
                      id="new-name"
                      placeholder="Enter new name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                )}

                <Button 
                  onClick={renameDevotee} 
                  disabled={isLoading || !selectedDevotee || !newName.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Renaming Devotee...
                    </>
                  ) : (
                    <>
                      <UserCog className="mr-2 h-4 w-4" />
                      Rename Devotee
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Devotees</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={top10ChartOption} style={{ height: '400px' }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Average Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={monthlyChartOption} style={{ height: '400px' }} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CardTitle>Recent Reports</CardTitle>
              <Badge variant="secondary" className="text-xs">
                Tip: Remove older reports by entering their Report ID
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter Report ID to remove"
                value={reportIdToRemove}
                onChange={(e) => setReportIdToRemove(e.target.value)}
                className="w-48"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (reportIdToRemove.trim()) {
                    removeReport(reportIdToRemove.trim());
                    setReportIdToRemove("");
                  } else {
                    toast.error("Please enter a valid Report ID");
                  }
                }}
                disabled={isLoading || !reportIdToRemove.trim()}
              >
                Remove
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRecentReports}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw 
              className={cn(
                "h-4 w-4",
                isLoading && "animate-spin"
              )} 
            />
            <span className="sr-only">Refresh reports</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Devotee</TableHead>
                <TableHead>Total Score</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {recentReports.map((report) => (
                  <motion.tr
                    key={report.report_id}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative transition-colors duration-200",
                      deletingReportId === report.report_id && [
                        "bg-red-100 dark:bg-red-900/30", // Stronger background color
                        "text-red-900 dark:text-red-100", // Text color change
                        "hover:bg-red-100 dark:hover:bg-red-900/30" // Maintain color on hover
                      ]
                    )}
                  >
                    <TableCell className="transition-colors">
                      {report.report_id}
                    </TableCell>
                    <TableCell className="transition-colors">
                      {new Date(report.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="transition-colors">
                      {report.devotee_name}
                    </TableCell>
                    <TableCell className="transition-colors">
                      {report.total_score}
                    </TableCell>
                    <TableCell>
                      <TableRowAction
                        isDeleting={deletingReportId === report.report_id}
                        onDelete={() => removeReport(report.report_id)}
                        onCancel={() => 
                          deletingReportId === report.report_id 
                            ? setDeletingReportId(null) 
                            : setDeletingReportId(report.report_id)
                        }
                      />
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}