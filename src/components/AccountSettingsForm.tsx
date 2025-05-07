
import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/supabaseUserUtils';
import { toast } from 'sonner';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { User } from '@supabase/supabase-js';

// List of countries for the dropdown
const countries = [
  { name: "United States", code: "US" },
  { name: "Canada", code: "CA" },
  { name: "United Kingdom", code: "GB" },
  { name: "Australia", code: "AU" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Spain", code: "ES" },
  { name: "Italy", code: "IT" },
  { name: "Japan", code: "JP" },
  { name: "China", code: "CN" },
  { name: "India", code: "IN" },
  // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

// Country calling codes
const countryCodes = [
  { country: "US", code: "+1" },
  { country: "CA", code: "+1" },
  { country: "GB", code: "+44" },
  { country: "AU", code: "+61" },
  { country: "DE", code: "+49" },
  { country: "FR", code: "+33" },
  { country: "ES", code: "+34" },
  { country: "IT", code: "+39" },
  { country: "JP", code: "+81" },
  { country: "CN", code: "+86" },
  { country: "IN", code: "+91" },
  // Add more country codes as needed
];

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.date(),
  country: z.string().min(1, "Country is required"),
  email: z.string().email("Invalid email address"),
  mobile_number: z.string().refine((value) => {
    if (!value) return false;
    try {
      return isValidPhoneNumber(value);
    } catch {
      return false;
    }
  }, "Invalid phone number"),
});

type ProfileFormValues = z.infer<typeof formSchema>;

export function AccountSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "",
      date_of_birth: new Date(),
      country: "",
      email: "",
      mobile_number: "",
    },
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          console.error('No user found when loading profile data');
          return;
        }

        // Type safety: explicitly define the result type and handle errors
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        // Check if we have valid profile data (not an error object)
        if (profile) {
          console.log('Loaded profile data:', profile);

          // If mobile number exists, try to determine the country code
          const mobileNumber = profile.mobile_number;
          if (mobileNumber) {
            try {
              const phoneNumber = parsePhoneNumber(mobileNumber);
              if (phoneNumber) {
                setSelectedCountryCode(`+${phoneNumber.countryCallingCode}`);
              }
            } catch (error) {
              console.error('Error parsing phone number:', error);
            }
          }

          // Use null coalescence to handle potentially missing fields
          form.reset({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            gender: profile.gender || "",
            date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : new Date(),
            country: profile.country || "",
            email: profile.email || "",
            mobile_number: profile.mobile_number || "",
          });
        }
      } catch (error) {
        console.error('Unexpected error when loading profile data:', error);
      }
    };

    loadProfileData();
  }, [form]);

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Create an explicitly typed update object
      const updateData: TablesUpdate<'profiles'> = {
        first_name: values.first_name,
        last_name: values.last_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth.toISOString().split('T')[0],
        country: values.country,
        email: values.email,
        mobile_number: values.mobile_number,
      };

      // Use proper type for the UUID comparison
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{field.value ? countries.find(c => c.code === field.value)?.name : "Select your country"}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <div className="flex gap-2">
                  <Select 
                    value={selectedCountryCode} 
                    onValueChange={setSelectedCountryCode}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue>{selectedCountryCode}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.country} value={cc.code}>
                          {cc.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormControl>
                    <Input 
                      placeholder="Enter your mobile number"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        field.onChange(`${selectedCountryCode}${value}`);
                      }}
                      value={field.value.replace(selectedCountryCode, '') || ''}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
