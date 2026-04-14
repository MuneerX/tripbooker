# Yes To Go Admin Dashboard

This is the administrative dashboard for the Yes To Go travel platform, built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Dashboard**: Real-time stats and analytics overview of sales, customers, and packages.
- **Booking Management**: Comprehensive workflow to view, confirm (with travel dates), and complete customer bookings.
- **Notification System**: Unified feed for managing pending reservations and customer review moderation.
- **Agent Portal**: Manage tour operators, referral codes, and track commissions.
- **Customer CRM**: Detailed customer profiles, status management, and activity tracking.
- **Tour Catalog**: Complete management of tour packages, trip itineraries, and locations.
- **Charter Tours**: Handle custom inquiries with read/unread tracking and submitter profiling.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up environment variables**:
    Create a `.env.local` file with your Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and Firebase configuration.
4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Deployment

This project is optimized for deployment on Vercel or Firebase App Hosting. Ensure all environment variables are correctly configured in your hosting provider's dashboard.
