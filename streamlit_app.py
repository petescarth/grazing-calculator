import streamlit as st
import pandas as pd
import numpy as np

st.set_page_config(page_title="Forage Budget Calculator", layout="wide")

st.title("Forage Budget Calculator")
st.write("Calculate available grazing days based on forage availability and herd composition")

# Define lookup tables
@st.cache_data
def load_lookup_tables():
    ae_lookup = {
        "Females <1 year": {"High": 0.77, "Moderate": 0.68, "Low": 0.57},
        "Females 1-2 years": {"High": 1.10, "Moderate": 0.91, "Low": 0.72},
        "Females 2-3 years": {"High": 1.74, "Moderate": 1.12, "Low": 0.96},
        "Females 3-4 years": {"High": 1.61, "Moderate": 1.49, "Low": 1.18},
        "Females 4+ years": {"High": 1.53, "Moderate": 1.28, "Low": 1.08},
        "Steers <1 year": {"High": 0.80, "Moderate": 0.72, "Low": 0.60},
        "Steers 1-2 years": {"High": 1.31, "Moderate": 1.03, "Low": 0.78},
        "Steers 2-3 years": {"High": 1.60, "Moderate": 1.27, "Low": 1.02},
        "Steers 3-4 years": {"High": 1.52, "Moderate": 1.39, "Low": 1.15},
        "Bulls": {"High": 1.55, "Moderate": 1.52, "Low": 1.29},
    }

    dse_lookup_sheep = {
        "Weaned Lamb (Gaining 100 g/day) 15kg": 0.8,
        "Weaned Lamb (Gaining 200 g/day) 15kg": 1.3,
        "Weaned Lamb (Gaining 100 g/day) 25kg": 1.1,
        "Weaned Lamb (Gaining 200 g/day) 25kg": 1.7,
        "Adult Dry Sheep (Maintain Weight) 45kg CS2": 0.9,
        "Adult Dry Sheep (Maintain Weight) 50kg CS2": 1.0,
        "Adult Dry Sheep (Maintain Weight) 50kg CS3": 1.0,
        "Adult Dry Sheep (Maintain Weight) 60kg CS3": 1.1,
        "Adult Dry Sheep (Gaining 50 g/day) 45kg": 1.2,
        "Adult Dry Sheep (Gaining 100 g/day) 45kg": 1.5,
        "Pregnant Ewe (Last 6 weeks, Single) 45kg": 1.4,
        "Pregnant Ewe (Last 4 weeks, Single) 45kg CS2": 1.2,
        "Pregnant Ewe (Last 6 weeks, Twins) 45kg": 1.8,
        "Pregnant Ewe (Last 4 weeks, Single) 50kg CS2": 1.5,
        "Pregnant Ewe (Last 6 weeks, Single) 50kg": 1.5,
        "Pregnant Ewe (Last 6 weeks, Twins) 50kg": 1.9,
        "Pregnant Ewe (Last 4 weeks, Single) 60kg CS3": 1.8,
        "Ewe with Single Lamb at Foot 45kg": 2.4,
        "Ewe with Single Lamb at Foot 45kg CS2": 1.8,
        "Ewe with Single Lamb at Foot 50kg": 3.0,
        "Ewe with Single Lamb at Foot 50kg CS3": 2.2,
        "Ewe with Single Lamb at Foot 60kg CS3": 2.6,
        "Ewe with Twin Lambs at Foot 45kg": 2.8,
        "Weaner (Growing at 0 g/day) 25kg": 0.7,
        "Weaner (Growing at 100 g/day) 25kg": 1.0,
        "Weaner (Growing at 0 g/day) 35kg": 0.8,
        "Weaner (Growing > 200 g/day) 35kg": 2.5,
    }

    dse_lookup_goat_table2 = {
        "Dry doe": (0.8, 30, 40),  # (DSE, min_weight, max_weight)
        "Breeding doe - During pregnancy": (1.4, 40, 60),
        "Breeding doe - During lactation – with single kid": (1.6, 40, 60),
        "Breeding doe - During lactation – with twins": (2.2, 40, 60),
        "Weaner (Growing at 100g/day)": (1.00, 20, 40),
        "Buck": (1.75, 60, 80),  # Using average 1.5-2
    }
    
    return ae_lookup, dse_lookup_sheep, dse_lookup_goat_table2

ae_lookup, dse_lookup_sheep, dse_lookup_goat_table2 = load_lookup_tables()

# Initialize session state variables if they don't exist
if 'total_ae' not in st.session_state:
    st.session_state.total_ae = 0
if 'total_dse' not in st.session_state:
    st.session_state.total_dse = 0
if 'cattle_data' not in st.session_state:
    st.session_state.cattle_data = []
if 'sheep_data' not in st.session_state:
    st.session_state.sheep_data = []
if 'goat_data' not in st.session_state:
    st.session_state.goat_data = []

# Add a sidebar with instructions
st.sidebar.title("Instructions")
st.sidebar.write("""
1. Enter your paddock details and forage information
2. Add your cattle (if any)
3. Add your sheep (if any)
4. Add your goats (if any)
5. Review your grazing budget results at the bottom
""")

st.sidebar.info("This calculator uses standard intake values based on Animal Equivalents (AE) and Dry Sheep Equivalents (DSE) to estimate grazing days.")

# SECTION 1: PADDOCK DETAILS
st.header("📊 Paddock and Forage Details", divider="gray")

col1, col2 = st.columns(2)

with col1:
    total_standing_dm_per_hectare = st.number_input(
        "Total standing dry matter (kg/ha)",
        min_value=0.0,
        value=5000.0,
        help="Enter the total amount of dry matter available in the paddock"
    )
    
    paddock_area_hectares = st.number_input(
        "Paddock area (hectares)",
        min_value=0.1,
        value=10.0,
        help="Enter the total area of the paddock in hectares"
    )

with col2:
    desired_rdm_per_hectare = st.number_input(
        "Desired residual dry matter per hectare (kg/ha)",
        min_value=0.0,
        value=1000.0,
        help="Enter the amount of dry matter you want to leave behind per hectare"
    )
    
    productivity_level = st.selectbox(
        "Overall productivity level of your grazing system",
        options=["High", "Moderate", "Low"],
        help="Higher productivity means animals consume less dry matter per kg of body weight"
    )

# Calculate total_standing_dm
total_standing_dm = total_standing_dm_per_hectare * paddock_area_hectares
st.info(f"Total standing dry matter: {total_standing_dm:.2f} kg")

# Calculate total desired RDM
desired_total_rdm = desired_rdm_per_hectare * paddock_area_hectares
st.info(f"Total desired residual dry matter: {desired_total_rdm:.2f} kg")

# SECTION 2: CATTLE DETAILS
st.header("🐄 Cattle Details", divider="gray")

cattle_expander = st.expander("Add and manage cattle")
with cattle_expander:
    # Add new cattle type form
    with st.form("add_cattle_form"):
        st.subheader("Add Cattle Type")
        
        col1, col2 = st.columns(2)
        
        with col1:
            cattle_type_name = st.text_input("Cattle type name", 
                                            value="", 
                                            help="E.g., 'Breeder Cows', 'Steers 1-2 years', 'Bulls'")
            
            number_of_animals = st.number_input("Number of animals", 
                                               min_value=1, 
                                               value=10,
                                               help="How many animals of this type")
        
        with col2:
            category_options = list(ae_lookup.keys())
            ae_type = st.selectbox("Animal category", 
                                  options=category_options,
                                  help="Select the category that best matches these animals")
            
            animal_productivity = st.selectbox("Animal productivity level",
                                             options=["High", "Moderate", "Low"],
                                             help="Select the productivity level for this group")
        
        submitted = st.form_submit_button("Add Cattle Type")
        
        if submitted:
            ae_rating = ae_lookup[ae_type][animal_productivity]
            new_entry = {
                "Type": cattle_type_name,
                "Category": ae_type,
                "Number": number_of_animals,
                "Productivity": animal_productivity,
                "AE Rating": ae_rating,
                "Total AE": number_of_animals * ae_rating
            }
            st.session_state.cattle_data.append(new_entry)
            st.session_state.total_ae += number_of_animals * ae_rating
            st.success(f"Added {number_of_animals} {cattle_type_name}")

# Display current cattle data
if st.session_state.cattle_data:
    st.subheader("Current Cattle Herd")
    cattle_df = pd.DataFrame(st.session_state.cattle_data)
    st.dataframe(cattle_df, use_container_width=True)
    
    total_ae = sum(entry["Total AE"] for entry in st.session_state.cattle_data)
    st.info(f"Total Animal Equivalents (AE): {total_ae:.2f}")
    
    if st.button("Clear Cattle Data"):
        st.session_state.cattle_data = []
        st.session_state.total_ae = 0
        st.experimental_rerun()

# SECTION 3: SHEEP DETAILS
st.header("🐑 Sheep Details", divider="gray")

sheep_expander = st.expander("Add and manage sheep")
with sheep_expander:
    # Add new sheep form
    with st.form("add_sheep_form"):
        st.subheader("Add Sheep Type")
        
        col1, col2 = st.columns(2)
        
        with col1:
            sheep_type_name = st.text_input("Sheep group name", 
                                          value="", 
                                          help="E.g., 'Ewes', 'Lambs', 'Rams'")
            
            number_of_animals_sheep = st.number_input("Number of sheep", 
                                                   min_value=1, 
                                                   value=10,
                                                   help="How many sheep of this type")
        
        with col2:
            animal_class_options = list(dse_lookup_sheep.keys())
            animal_class_name = st.selectbox("Sheep class", 
                                           options=animal_class_options,
                                           help="Select the class that best matches these animals")
            dse_rating = dse_lookup_sheep[animal_class_name]
        
        submitted_sheep = st.form_submit_button("Add Sheep Type")
        
        if submitted_sheep:
            new_entry = {
                "Type": "Sheep",
                "Group": sheep_type_name,
                "Class": animal_class_name,
                "Number": number_of_animals_sheep,
                "DSE Rating": dse_rating,
                "Total DSE": number_of_animals_sheep * dse_rating
            }
            st.session_state.sheep_data.append(new_entry)
            st.session_state.total_dse += number_of_animals_sheep * dse_rating
            st.success(f"Added {number_of_animals_sheep} {sheep_type_name} - {animal_class_name}")

# Display current sheep data
if st.session_state.sheep_data:
    st.subheader("Current Sheep Flock")
    sheep_df = pd.DataFrame(st.session_state.sheep_data)
    st.dataframe(sheep_df, use_container_width=True)
    
    total_sheep_dse = sum(entry["Total DSE"] for entry in st.session_state.sheep_data)
    st.info(f"Total Sheep DSE: {total_sheep_dse:.2f}")
    
    if st.button("Clear Sheep Data"):
        st.session_state.sheep_data = []
        st.session_state.total_dse = sum(entry["Total DSE"] for entry in st.session_state.goat_data)
        st.experimental_rerun()

# SECTION 4: GOAT DETAILS
st.header("🐐 Goat Details", divider="gray")

goat_expander = st.expander("Add and manage goats")
with goat_expander:
    # Add new goat form
    with st.form("add_goat_form"):
        st.subheader("Add Goat Type")
        
        col1, col2 = st.columns(2)
        
        with col1:
            goat_type_name = st.text_input("Goat group name", 
                                         value="", 
                                         help="E.g., 'Does', 'Kids', 'Bucks'")
            
            number_of_animals_goat = st.number_input("Number of goats", 
                                                  min_value=1, 
                                                  value=10,
                                                  help="How many goats of this type")
        
        with col2:
            goat_class_options = list(dse_lookup_goat_table2.keys())
            animal_class_name = st.selectbox("Goat class", 
                                           options=goat_class_options,
                                           help="Select the class that best matches these animals")
            
            live_weight_kg = st.number_input("Average live weight (kg)", 
                                           min_value=10.0, 
                                           value=40.0,
                                           help="Average weight of the animals")
            
            # Get DSE rating for goats
            rating_info = dse_lookup_goat_table2[animal_class_name]
            dse_rating = rating_info[0]  # Base rating
            
            # Adjust if weight is outside the standard range
            min_weight, max_weight = rating_info[1], rating_info[2]
            if live_weight_kg < min_weight:
                dse_rating *= live_weight_kg / min_weight
            elif live_weight_kg > max_weight:
                dse_rating *= live_weight_kg / max_weight
        
        submitted_goat = st.form_submit_button("Add Goat Type")
        
        if submitted_goat:
            new_entry = {
                "Type": "Goat",
                "Group": goat_type_name,
                "Class": animal_class_name,
                "Number": number_of_animals_goat,
                "Weight (kg)": live_weight_kg,
                "DSE Rating": dse_rating,
                "Total DSE": number_of_animals_goat * dse_rating
            }
            st.session_state.goat_data.append(new_entry)
            st.session_state.total_dse += number_of_animals_goat * dse_rating
            st.success(f"Added {number_of_animals_goat} {goat_type_name} - {animal_class_name}")

# Display current goat data
if st.session_state.goat_data:
    st.subheader("Current Goat Herd")
    goat_df = pd.DataFrame(st.session_state.goat_data)
    st.dataframe(goat_df, use_container_width=True)
    
    total_goat_dse = sum(entry["Total DSE"] for entry in st.session_state.goat_data)
    st.info(f"Total Goat DSE: {total_goat_dse:.2f}")
    
    if st.button("Clear Goat Data"):
        st.session_state.goat_data = []
        st.session_state.total_dse = sum(entry["Total DSE"] for entry in st.session_state.sheep_data)
        st.experimental_rerun()

# SECTION 5: RESULTS
st.header("📈 Results", divider="gray")

total_ae = st.session_state.total_ae
total_dse = st.session_state.total_dse

# Display herd summary
st.subheader("Herd Summary")
col1, col2 = st.columns(2)
with col1:
    st.metric("Total Animal Equivalents (AE)", f"{total_ae:.2f}")
with col2:
    st.metric("Total Dry Sheep Equivalents (DSE)", f"{total_dse:.2f}")

# Show breakdown of DSE by animal type
if st.session_state.sheep_data or st.session_state.goat_data:
    sheep_dse = sum(entry["Total DSE"] for entry in st.session_state.sheep_data)
    goat_dse = sum(entry["Total DSE"] for entry in st.session_state.goat_data)
    
    st.subheader("DSE Breakdown")
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Sheep DSE", f"{sheep_dse:.2f}")
    with col2:
        st.metric("Goat DSE", f"{goat_dse:.2f}")

# Calculate daily feed demand
if productivity_level == "High":
    intake_per_ae = 7.5
    intake_per_dse = 0.89
elif productivity_level == "Moderate":
    intake_per_ae = 8.0
    intake_per_dse = 0.95
else:  # Low
    intake_per_ae = 8.5
    intake_per_dse = 1.01

total_daily_demand = (total_ae * intake_per_ae) + (total_dse * intake_per_dse)

# Ensure available dry matter isn't negative
available_dm_for_grazing = max(0, total_standing_dm - desired_total_rdm)

# Calculate grazing days
if total_daily_demand > 0:
    grazing_days = available_dm_for_grazing / total_daily_demand
else:
    grazing_days = 0

# Display results
st.subheader("Grazing Budget Results")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Total Daily Demand (kg/day)", f"{total_daily_demand:.2f}")
with col2:
    st.metric("Available Dry Matter (kg)", f"{available_dm_for_grazing:.2f}")
with col3:
    st.metric("Estimated Grazing Days", f"{grazing_days:.1f}")

# Add visualization
if total_daily_demand > 0 and total_standing_dm > 0:
    st.subheader("Feed Budget Visualization")
    
    # Create data for the chart
    days = min(int(grazing_days * 1.5), 100)  # Show up to 100 days or 1.5x the estimated grazing days
    forage_remaining = []
    
    current_dm = total_standing_dm
    for _ in range(days):
        forage_remaining.append(current_dm)
        current_dm = max(desired_total_rdm, current_dm - total_daily_demand)
    
    # Create the chart
    chart_data = pd.DataFrame({
        'Day': range(days),
        'Forage Remaining (kg)': forage_remaining,
        'Residual Target': [desired_total_rdm] * days
    })
    
    st.line_chart(
        chart_data.set_index('Day'),
        height=400
    )

st.write("""
### Notes:
- This is an estimate based on the provided information and standard values
- Actual grazing days may vary based on weather, pasture growth, and animal behavior
- Regular monitoring is recommended to adjust grazing plans as needed
""")

# Add a footer
st.markdown("---")
st.caption("Forage Budget Calculator | v1.2")