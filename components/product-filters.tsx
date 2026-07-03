"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { api } from "@/lib/api"

interface ProductFiltersProps {
  storeId: string
  onFilterChange: (filters: { search: string; department: string; kitchen: string }) => void
}

export function ProductFilters({ storeId, onFilterChange }: ProductFiltersProps) {
  const [search, setSearch] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedKitchen, setSelectedKitchen] = useState("")
  const [departments, setDepartments] = useState<any[]>([])
  const [kitchens, setKitchens] = useState<any[]>([])

  useEffect(() => {
    loadFilters()
  }, [storeId])

  useEffect(() => {
    onFilterChange({ search, department: selectedDepartment, kitchen: selectedKitchen })
  }, [search, selectedDepartment, selectedKitchen])

  const loadFilters = async () => {
    try {
      const [deptResponse, kitchenResponse] = await Promise.all([
        api.department.list({ storeId, page: 1, limit: 50 }),
        api.kitchen.list({ storeId, page: 1, limit: 50 }),
      ])

      setDepartments(deptResponse.data?.departments || deptResponse.departments || [])
      setKitchens(kitchenResponse.data?.kitchens || kitchenResponse.kitchens || [])
    } catch (error) {
      console.error("[v0] Error loading filters:", error)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedDepartment("")
    setSelectedKitchen("")
  }

  const hasActiveFilters = search || selectedDepartment || selectedKitchen

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {departments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <Button
                key={dept._id}
                variant={selectedDepartment === dept._id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDepartment(selectedDepartment === dept._id ? "" : dept._id)}
              >
                {dept.name}
              </Button>
            ))}
          </div>
        )}

        {kitchens.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kitchens.map((kitchen) => (
              <Button
                key={kitchen._id}
                variant={selectedKitchen === kitchen._id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedKitchen(selectedKitchen === kitchen._id ? "" : kitchen._id)}
              >
                {kitchen.name}
              </Button>
            ))}
          </div>
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
