// @ts-check
import React from "react";
import { Outlet } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../../../components/ui/tabs";

/**
 * Main analytics dashboard for assignments
 * @returns {React.ReactElement} Assignment analytics component
 */
export function AssignmentAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grades">
          <TabsList>
            <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
            <TabsTrigger value="submissions">Submission Stats</TabsTrigger>
            <TabsTrigger value="performance">Performance Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="grades">
            <Outlet />
          </TabsContent>

          <TabsContent value="submissions">
            <Outlet />
          </TabsContent>

          <TabsContent value="performance">
            <Outlet />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
