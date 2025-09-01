import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, MapPin, Search } from "lucide-react";
import DatePickerWithRange from "@/components/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { Category } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/auth";
import AuthModal from "../components/AuthModal";

interface DynamicHeroProps {
  title: string;
  description: string;
  imageUrl: string;
  categories: Category[];
}

const DynamicHero: React.FC<DynamicHeroProps> = ({ title, description, imageUrl, categories }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (location) {
      params.append("location", location);
    }
    
    if (category) {
      params.append("category", category);
    }
    
    if (dateRange?.from) {
      params.append("from", dateRange.from.toISOString().split("T")[0]);
    }
    
    if (dateRange?.to) {
      params.append("to", dateRange.to.toISOString().split("T")[0]);
    }
    
    navigate(`/equipments?${params.toString()}`);
  };

  return (
    <div
      className="relative bg-cover bg-center h-[500px] md:h-[550px] lg:h-[600px] flex items-center"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="container mx-auto px-4 relative z-10 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-lg md:text-xl mb-8">{description}</p>
          
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 inline-block mr-1" />
                  Localisation
                </label>
                <Input
                  className="w-full"
                  placeholder="Ville, quartier..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  <Search className="h-4 w-4 inline-block mr-1" />
                  Catégorie
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  <CalendarDays className="h-4 w-4 inline-block mr-1" />
                  Dates
                </label>
                <DatePickerWithRange
                  date={dateRange}
                  setDate={setDateRange}
                  className="w-full"
                  buttonClassName="w-full justify-start text-left font-normal border rounded-md h-10"
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  className="w-full bg-terracotta hover:bg-terracotta/90"
                  onClick={() => {
                    if (user) {
                      handleSearch();
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                >
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
};

export default DynamicHero;
