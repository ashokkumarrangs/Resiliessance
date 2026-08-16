import { supabase } from "@/lib/supabase";
import { calculateComponentHealth, calculateAverageDailyMileage, ComponentHealth } from "@/lib/vehicle-calculations";

export interface VehicleComponent {
  id: string;
  vehicle_id: string;
  component_name: string;
  category: string;
  brand_model: string | null;
  cost: number;
  notes: string | null;
  installed_date: string;
  installed_odometer: number;
  limit_odometer: number | null;
  limit_months: number | null;
  is_active: boolean;
  created_at?: string;
  
  // Enriched fields calculated at runtime
  health?: ComponentHealth;
  current_vehicle_odometer?: number;
}

export interface ComponentHistoryRecord {
  id: string;
  component_id: string | null;
  vehicle_id: string;
  component_name: string;
  category: string;
  brand_model: string | null;
  installed_date: string;
  installed_odometer: number;
  replaced_date: string;
  replaced_odometer: number;
  distance_traveled: number;
  months_in_service: number;
  cost: number;
  replacement_reason: string | null;
}

export function useVehicleComponents() {
  
  const getComponents = async (vehicleId: string): Promise<VehicleComponent[]> => {
    // 1. Fetch active components
    const { data: componentsData, error: compError } = await supabase
      .from('vehicle_components')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('is_active', true)
      .order('component_name');

    if (compError) throw compError;
    if (!componentsData || componentsData.length === 0) return [];

    // 2. Fetch vehicle details & logs for calculations
    const [
      { data: vehicle },
      { data: fuelLogs },
      { data: serviceLogs },
      { data: mileageLogs }
    ] = await Promise.all([
      supabase.from('vehicle_config').select('initial_odometer, created_at').eq('id', vehicleId).single(),
      supabase.from('vehicle_fuel_logs').select('odometer, date').eq('vehicle_id', vehicleId),
      supabase.from('vehicle_service_logs').select('odometer, date').eq('vehicle_id', vehicleId),
      supabase.from('vehicle_mileage_logs').select('odometer, date').eq('vehicle_id', vehicleId),
    ]);

    const initialOdo = vehicle?.initial_odometer || 0;
    const vehicleCreatedAt = vehicle?.created_at || new Date().toISOString();

    // Combine all logs containing odometer
    const allOdoLogs: { odometer: number; date: string }[] = [];
    if (fuelLogs) allOdoLogs.push(...fuelLogs.map((l: any) => ({ odometer: Number(l.odometer), date: l.date })));
    if (serviceLogs) allOdoLogs.push(...serviceLogs.map((l: any) => ({ odometer: Number(l.odometer), date: l.date })));
    if (mileageLogs) allOdoLogs.push(...mileageLogs.map((l: any) => ({ odometer: Number(l.odometer), date: l.date })));

    // Calculate current odometer
    const currentOdometer = Math.max(
      initialOdo,
      ...allOdoLogs.map(l => l.odometer)
    );

    // Calculate average daily mileage
    const averageDailyMileage = calculateAverageDailyMileage(allOdoLogs, initialOdo, vehicleCreatedAt);

    // 3. Compute health for each component
    const now = new Date();
    const enrichedComponents = componentsData.map((comp: any) => {
      const health = calculateComponentHealth({
        currentOdometer,
        currentDate: now,
        installedDate: comp.installed_date,
        installedOdometer: comp.installed_odometer,
        limitOdometer: comp.limit_odometer,
        limitMonths: comp.limit_months,
        averageDailyMileage
      });
      health.componentId = comp.id;

      return {
        ...comp,
        health,
        current_vehicle_odometer: currentOdometer
      } as VehicleComponent;
    });

    return enrichedComponents;
  };

  const getComponentHistory = async (vehicleId: string): Promise<ComponentHistoryRecord[]> => {
    const { data, error } = await supabase
      .from('vehicle_component_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('replaced_date', { ascending: false });

    if (error) throw error;
    return data as ComponentHistoryRecord[];
  };

  const addComponent = async (component: Omit<VehicleComponent, 'id' | 'is_active'>) => {
    const { data, error } = await supabase
      .from('vehicle_components')
      .insert([{ ...component, is_active: true }])
      .select();

    if (error) throw error;
    return data;
  };

  const updateComponent = async (id: string, updates: Partial<Omit<VehicleComponent, 'id'>>) => {
    const { data, error } = await supabase
      .from('vehicle_components')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  };

  const deleteComponent = async (id: string) => {
    const { error } = await supabase
      .from('vehicle_components')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  /**
   * Performs the component replacement operation:
   * 1. Inserts into component history
   * 2. Resets the baseline tracking of the active component
   * 3. Creates a record in service logs
   */
  const replaceComponent = async (params: {
    component: VehicleComponent;
    replacedDate: string;
    replacedOdometer: number;
    cost: number;
    brandModel: string | null;
    serviceCenter: string | null;
    replacementReason: string;
    notes: string | null;
  }) => {
    const { component, replacedDate, replacedOdometer, cost, brandModel, serviceCenter, replacementReason, notes } = params;

    // Calculate achieved metrics
    const distanceTraveled = Math.max(0, replacedOdometer - component.installed_odometer);
    const monthsInService = Math.round(
      Math.max(
        0,
        (new Date(replacedDate).getTime() - new Date(component.installed_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      )
    );

    // 1. Insert history record
    const { error: histError } = await supabase
      .from('vehicle_component_history')
      .insert([{
        component_id: component.id,
        vehicle_id: component.vehicle_id,
        component_name: component.component_name,
        category: component.category,
        brand_model: component.brand_model,
        installed_date: component.installed_date,
        installed_odometer: component.installed_odometer,
        replaced_date: replacedDate,
        replaced_odometer: replacedOdometer,
        distance_traveled: distanceTraveled,
        months_in_service: monthsInService,
        cost: component.cost || 0,
        replacement_reason: replacementReason
      }]);

    if (histError) throw histError;

    // 2. Insert service log record
    const serviceDetails = `Replaced component: ${component.component_name} (Brand: ${brandModel || 'N/A'}). ` +
      `Old component details: lasted ${distanceTraveled} units over ${monthsInService} months.`;

    const { error: serviceError } = await supabase
      .from('vehicle_service_logs')
      .insert([{
        vehicle_id: component.vehicle_id,
        date: replacedDate,
        amount: cost,
        odometer: replacedOdometer,
        service_center: serviceCenter || 'DIY',
        details: serviceDetails,
        notes: notes || ''
      }]);

    if (serviceError) throw serviceError;

    // 3. Reset component tracking baseline
    const { error: resetError } = await supabase
      .from('vehicle_components')
      .update({
        installed_date: replacedDate,
        installed_odometer: replacedOdometer,
        brand_model: brandModel || component.brand_model,
        cost: cost,
        notes: notes
      })
      .eq('id', component.id);

    if (resetError) throw resetError;
  };

  return {
    getComponents,
    getComponentHistory,
    addComponent,
    updateComponent,
    deleteComponent,
    replaceComponent
  };
}
