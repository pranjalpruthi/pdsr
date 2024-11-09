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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  async function removeReport() {
    if (!reportId) {
      toast.error("Please enter a report ID");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sadhna_report')
        .delete()
        .eq('report_id', reportId);

      if (error) throw error;

      showSuccess(
        "Report Removed Successfully",
        `Report #${reportId} has been permanently removed from the system.`
      );
      
      setReportId("");
      await loadChartData();
      router.refresh();
      
      // Close the confirmation dialog
      const closeButton = document.querySelector('[data-state="open"] [role="alertdialog"] button[data-state="closed"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }

    } catch (error) {
      toast.error("Failed to remove report");
    } finally {
      setIsLoading(false);
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
          <CardTitle>Devotee Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="add" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="add">Add</TabsTrigger>
              <TabsTrigger value="remove">Remove</TabsTrigger>
              <TabsTrigger value="rename">Rename</TabsTrigger>
              <TabsTrigger value="report">Reports</TabsTrigger>
            </TabsList>

            {/* Add Devotees Tab */}
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Type devotee name and press Enter"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleAddName}
                  disabled={isLoading}
                />
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                  {devoteeNames.map((name, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {name}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeName(name)} />
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={addDevotee} disabled={isLoading || devoteeNames.length === 0} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Devotees...
                  </>
                ) : (
                  `Add ${devoteeNames.length} Devotee${devoteeNames.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </TabsContent>

            {/* Remove Devotee Tab */}
            <TabsContent value="remove" className="space-y-4">
              <Select onValueChange={setSelectedDevotee} value={selectedDevotee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select devotee" />
                </SelectTrigger>
                <SelectContent>
                  {devotees.map((devotee) => (
                    <SelectItem key={devotee.devotee_id} value={devotee.devotee_id}>
                      {devotee.devotee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading || !selectedDevotee} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      'Remove Devotee'
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the
                      devotee and all associated reports.
                    </DialogDescription>
                  </DialogHeader>
                  <Button variant="destructive" onClick={removeDevotee}>
                    Yes, Remove Devotee
                  </Button>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Rename Devotee Tab */}
            <TabsContent value="rename" className="space-y-4">
              <Select onValueChange={setSelectedDevotee} value={selectedDevotee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select devotee" />
                </SelectTrigger>
                <SelectContent>
                  {devotees.map((devotee) => (
                    <SelectItem key={devotee.devotee_id} value={devotee.devotee_id}>
                      {devotee.devotee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Enter new name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button 
                onClick={renameDevotee} 
                disabled={isLoading || !selectedDevotee || !newName.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  'Rename Devotee'
                )}
              </Button>
            </TabsContent>

            {/* Remove Report Tab */}
            <TabsContent value="report" className="space-y-4">
              <Input
                type="number"
                placeholder="Enter report ID"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading || !reportId} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      'Remove Report'
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the report.
                    </DialogDescription>
                  </DialogHeader>
                  <Button variant="destructive" onClick={removeReport}>
                    Yes, Remove Report
                  </Button>
                </DialogContent>
              </Dialog>
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

      {/* Updated Recent Reports Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Reports</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((report) => (
                <TableRow key={report.report_id}>
                  <TableCell>{report.report_id}</TableCell>
                  <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                  <TableCell>{report.devotee_name}</TableCell>
                  <TableCell>{report.total_score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}