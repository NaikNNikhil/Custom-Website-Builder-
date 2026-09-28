"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, NativeSelect } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuGroupLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table"
import { Bell, Heart, Mail, Plus, Search, Settings, Trash, User, Info, CheckCircle, AlertTriangle, Menu, Shield } from "lucide-react"

export default function UiLibraryPage() {
  const { toast } = useToast()

  // Interactive state demos
  const [checkboxChecked, setCheckboxChecked] = React.useState(true)
  const [radioValue, setRadioValue] = React.useState("option-1")
  const [switchChecked, setSwitchChecked] = React.useState(true)
  const [progressVal, setProgressVal] = React.useState(65)
  const [drawerPlacement, setDrawerPlacement] = React.useState<"right" | "left" | "top" | "bottom">("right")
  const [dropdownCheckState, setDropdownCheckState] = React.useState(true)
  const [selectValue, setSelectValue] = React.useState("starter")

  return (
    <TooltipProvider>
      <div className="p-6 max-w-7xl mx-auto space-y-10 pb-24 md:p-8">
        {/* Page Header */}
        <div className="space-y-2 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <Shield className="size-7 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight md:text-[1.75rem]">UI Library</h1>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Application UI foundation. These components power Admin, Customer, and Builder chrome —
            not customer Website Themes.
          </p>
        </div>

        {/* 1. ACTIONS */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Actions</h2>
            <p className="text-sm text-muted-foreground">Buttons and Icon Buttons supporting various variants, sizes, and interactive states.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Button Component */}
            <Card>
              <CardHeader>
                <CardTitle>Button</CardTitle>
                <CardDescription>Variants and size options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled>Disabled</Button>
                  <Button variant="outline" disabled>Disabled Outline</Button>
                  <Button variant="default">
                    <Plus className="size-4 mr-1" /> With Icon
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Icon Button Component */}
            <Card>
              <CardHeader>
                <CardTitle>Icon Button</CardTitle>
                <CardDescription>Compact buttons for iconography actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <IconButton aria-label="Search" variant="default"><Search className="size-4" /></IconButton>
                  <IconButton aria-label="Settings" variant="secondary"><Settings className="size-4" /></IconButton>
                  <IconButton aria-label="Notifications" variant="outline"><Bell className="size-4" /></IconButton>
                  <IconButton aria-label="Favorite" variant="ghost"><Heart className="size-4" /></IconButton>
                  <IconButton aria-label="Delete" variant="destructive"><Trash className="size-4" /></IconButton>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3">
                  <IconButton aria-label="XS" size="icon-xs" variant="outline"><Mail className="size-3" /></IconButton>
                  <IconButton aria-label="SM" size="icon-sm" variant="outline"><Mail className="size-3.5" /></IconButton>
                  <IconButton aria-label="MD" size="icon" variant="outline"><Mail className="size-4" /></IconButton>
                  <IconButton aria-label="LG" size="icon-lg" variant="outline"><Mail className="size-5" /></IconButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 2. FORMS */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Forms</h2>
            <p className="text-sm text-muted-foreground">Standardized form controls, labels, and state indicators.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input & Label */}
            <Card>
              <CardHeader>
                <CardTitle>Input & Label</CardTitle>
                <CardDescription>Text inputs, disabled states, error states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-input">Email Address</Label>
                  <Input id="email-input" type="email" placeholder="name@example.com" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input id="disabled-input" disabled value="Read-only field value" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="invalid-input" className="text-destructive">Invalid Input</Label>
                  <Input id="invalid-input" aria-invalid="true" defaultValue="invalid@format" />
                </div>
              </CardContent>
            </Card>

            {/* Textarea & Select */}
            <Card>
              <CardHeader>
                <CardTitle>Textarea & Select</CardTitle>
                <CardDescription>Multi-line text input & option selects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bio-textarea">Biography</Label>
                  <Textarea id="bio-textarea" placeholder="Write a short description..." />
                </div>

                <div className="space-y-1.5">
                  <Label>Plan Selection</Label>
                  <NativeSelect value={selectValue} onChange={(e) => setSelectValue(e.target.value)}>
                    <option value="starter">Starter Plan ($9/mo)</option>
                    <option value="pro">Pro Plan ($29/mo)</option>
                    <option value="enterprise">Enterprise Plan (Custom)</option>
                  </NativeSelect>
                </div>
              </CardContent>
            </Card>

            {/* Checkbox, Radio, Switch */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Checkbox, Radio & Switch</CardTitle>
                <CardDescription>Interactive binary & single-choice controls</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                {/* Checkbox Demo */}
                <div className="space-y-3">
                  <Label className="font-semibold">Checkbox</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms-check"
                      checked={checkboxChecked}
                      onCheckedChange={(checked) => setCheckboxChecked(Boolean(checked))}
                    />
                    <Label htmlFor="terms-check">Accept Terms & Conditions</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">State: {checkboxChecked ? "Checked" : "Unchecked"}</p>
                </div>

                {/* Radio Demo */}
                <div className="space-y-3">
                  <Label className="font-semibold">Radio Group</Label>
                  <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-1" id="r1" />
                      <Label htmlFor="r1">Option 1 (Default)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-2" id="r2" />
                      <Label htmlFor="r2">Option 2</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">Selected: {radioValue}</p>
                </div>

                {/* Switch Demo */}
                <div className="space-y-3">
                  <Label className="font-semibold">Switch</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-switch"
                      checked={switchChecked}
                      onCheckedChange={(checked) => setSwitchChecked(Boolean(checked))}
                    />
                    <Label htmlFor="notify-switch">Email Notifications</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">State: {switchChecked ? "Enabled" : "Disabled"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. DISPLAY */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Display</h2>
            <p className="text-sm text-muted-foreground">Visual display components, statuses, skeleton, spinner, progress, and avatars.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Badges & Avatars */}
            <Card>
              <CardHeader>
                <CardTitle>Badge & Avatar</CardTitle>
                <CardDescription>Status tags and user profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">BADGE VARIANTS</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">AVATARS</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12">
                      <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-10">
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <Avatar className="size-8">
                      <AvatarFallback>CW</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skeleton, Spinner & Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Skeleton, Spinner & Progress</CardTitle>
                <CardDescription>Loading states and indicator graphics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">SKELETON PLACEHOLDERS</Label>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="size-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[4/5]" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">SPINNERS</Label>
                  <div className="flex items-center gap-4">
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="text-xs font-semibold text-muted-foreground">PROGRESS BAR</Label>
                    <span>{progressVal}%</span>
                  </div>
                  <Progress value={progressVal} />
                  <div className="flex gap-2 pt-1">
                    <Button size="xs" variant="outline" onClick={() => setProgressVal(Math.max(0, progressVal - 15))}>-15%</Button>
                    <Button size="xs" variant="outline" onClick={() => setProgressVal(Math.min(100, progressVal + 15))}>+15%</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. FEEDBACK */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Feedback</h2>
            <p className="text-sm text-muted-foreground">Alert banners and interactive toast notifications.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Alert Component */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Banners</CardTitle>
                <CardDescription>Inline contextual messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="info">
                  <Info className="size-4" />
                  <AlertTitle>System Update</AlertTitle>
                  <AlertDescription>Maintenance scheduled for tonight at 02:00 UTC.</AlertDescription>
                </Alert>

                <Alert variant="success">
                  <CheckCircle className="size-4" />
                  <AlertTitle>Changes Saved</AlertTitle>
                  <AlertDescription>Your custom theme configuration has been updated.</AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Operation Failed</AlertTitle>
                  <AlertDescription>Could not reach backend API endpoint.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Toast Component */}
            <Card>
              <CardHeader>
                <CardTitle>Toast Notifications</CardTitle>
                <CardDescription>Global auto-dismissing toast messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Click below to dispatch real toast notifications:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: "Action completed", description: "Your standard request was processed.", variant: "default" })}
                  >
                    Default Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-success border-success/30 hover:bg-success/10"
                    onClick={() => toast({ title: "Saved successfully!", description: "Role permissions updated.", variant: "success" })}
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => toast({ title: "Access denied", description: "You lack required permissions.", variant: "error" })}
                  >
                    Error Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-warning border-warning/30 hover:bg-warning/10"
                    onClick={() => toast({ title: "Storage limit 90%", description: "Please upgrade your quota.", variant: "warning" })}
                  >
                    Warning Toast
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. OVERLAYS */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Overlays & Interaction</h2>
            <p className="text-sm text-muted-foreground">Dialogs, drawers, popovers, tooltips, and dropdown menus with full open/close interaction.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Dialog Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Dialog / Modal</CardTitle>
                <CardDescription>Accessible backdrop popup modal</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" className="w-full">Open Modal Dialog</Button>} />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Action</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to proceed with this operation? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline">Cancel</Button>} />
                      <DialogClose render={<Button variant="destructive">Confirm</Button>} />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Drawer Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Drawer</CardTitle>
                <CardDescription>Side & bottom sliding panels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Select value={drawerPlacement} onValueChange={(v) => { if (v) setDrawerPlacement(v) }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Placement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Drawer>
                  <DrawerTrigger render={<Button variant="outline" className="w-full">Open {drawerPlacement} Drawer</Button>} />
                  <DrawerContent placement={drawerPlacement}>
                    <DrawerHeader>
                      <DrawerTitle>Drawer Panel ({drawerPlacement})</DrawerTitle>
                      <DrawerDescription>Slide-out layout drawer for contextual controls.</DrawerDescription>
                    </DrawerHeader>
                    <div className="py-6 space-y-4 text-sm">
                      <p>This panel uses standard production Drawer primitive with configurable overlay & placements.</p>
                    </div>
                    <DrawerFooter>
                      <DrawerClose render={<Button variant="outline">Close Panel</Button>} />
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </CardContent>
            </Card>

            {/* Popover & Tooltip */}
            <Card>
              <CardHeader>
                <CardTitle>Popover & Tooltip</CardTitle>
                <CardDescription>Hover and click floating layers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {/* Tooltip */}
                  <Tooltip>
                    <TooltipTrigger render={<Button variant="outline" size="sm">Hover for Tooltip</Button>} />
                    <TooltipContent>Standard UI Tooltip</TooltipContent>
                  </Tooltip>

                  {/* Popover */}
                  <Popover>
                    <PopoverTrigger render={<Button variant="outline" size="sm">Open Popover</Button>} />
                    <PopoverContent>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Popover Settings</h4>
                        <p className="text-xs text-muted-foreground">Adjust settings directly within floating popover.</p>
                        <Button size="xs" className="w-full">Save Quick Options</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Dropdown Menu Demo */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Dropdown Menu</CardTitle>
                <CardDescription>Action list and option picker menus</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline"><Menu className="size-4 mr-2" /> Open User Menu</Button>} />
                  <DropdownMenuContent align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuGroupLabel>My Account</DropdownMenuGroupLabel>
                      <DropdownMenuItem><User className="size-4 mr-2" /> Profile Settings</DropdownMenuItem>
                      <DropdownMenuItem><Mail className="size-4 mr-2" /> Messages</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuCheckboxItem
                        checked={dropdownCheckState}
                        onCheckedChange={(checked) => setDropdownCheckState(Boolean(checked))}
                      >
                        Show Status Badge
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive"><Trash className="size-4 mr-2" /> Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <p className="text-xs text-muted-foreground">
                  Status Toggle: {dropdownCheckState ? "Active" : "Inactive"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 6. NAVIGATION */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Navigation & Structure</h2>
            <p className="text-sm text-muted-foreground">Tabs, breadcrumbs, and pagination controls.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Tabs</CardTitle>
                <CardDescription>View switching tab bar</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="account">
                  <TabsList className="w-full">
                    <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
                    <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="account" className="p-4 rounded-md border text-sm mt-3">
                    Account management content panel.
                  </TabsContent>
                  <TabsContent value="password" className="p-4 rounded-md border text-sm mt-3">
                    Change password & security credentials.
                  </TabsContent>
                  <TabsContent value="settings" className="p-4 rounded-md border text-sm mt-3">
                    System notifications & preference configuration.
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Breadcrumb & Pagination */}
            <Card>
              <CardHeader>
                <CardTitle>Breadcrumb & Pagination</CardTitle>
                <CardDescription>Hierarchy path & data paginators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">BREADCRUMB</Label>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="#">Admin</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="#">System</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>UI Library</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">PAGINATION</Label>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                      <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
                      <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                      <PaginationItem><PaginationEllipsis /></PaginationItem>
                      <PaginationItem><PaginationNext href="#" /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 7. DATA */}
        <section className="space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Data</h2>
            <p className="text-sm text-muted-foreground">Structured tabular data display.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Table</CardTitle>
              <CardDescription>Data grid table component with responsive wrapper</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of recent system administrative roles.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Permissions Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">SUPER_ADMIN</TableCell>
                    <TableCell>All Permissions</TableCell>
                    <TableCell><Badge variant="success">Active</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="outline">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">ADMIN</TableCell>
                    <TableCell>14 Permissions</TableCell>
                    <TableCell><Badge variant="success">Active</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="outline">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CUSTOMER</TableCell>
                    <TableCell>2 Permissions</TableCell>
                    <TableCell><Badge variant="secondary">Default</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="outline">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </TooltipProvider>
  )
}
