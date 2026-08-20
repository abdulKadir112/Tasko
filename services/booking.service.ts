import api from "@/config/api";

/* =========================================================
   BOOKING STATUS
========================================================= */
export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "reschedule_requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

/* =========================================================
   FIREBASE TIMESTAMP
========================================================= */
export type FirebaseTimestampLike = {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

/* =========================================================
   BOOKING PACKAGE
========================================================= */
export type BookingPackage = {
  id: "basic" | "standard" | "premium";
  title: string;
  price: number;
  description?: string;
  deliveryHours?: number;
};

/* =========================================================
   BOOKING
========================================================= */
export type Booking = {
  id: string;

  /**
   * Job based booking
   */
  jobId?: string | null;

  /**
   * Service based booking
   */
  serviceId?: string | null;

  workerId: string;
  customerId: string;

  serviceTitle?: string;
  category?: string;
  price?: number;

  requestedDate?: string | null;

  customerMessage?: string;

  /* =====================================================
     CONTACT / LOCATION INFORMATION
  ===================================================== */

  /**
   * Service address
   */
  address?: string | null;

  /**
   * Customer city
   */
  city?: string | null;

  /**
   * Customer contact phone
   */
  phone?: string | null;

  /**
   * Booking urgency
   */
  urgency?: "normal" | "urgent";

  /* =====================================================
     SELECTED PACKAGE
  ===================================================== */

  packageId?:
    | "basic"
    | "standard"
    | "premium"
    | null;

  packageTitle?: string | null;

  packagePrice?: number | null;

  packageDeliveryHours?: number | null;

  selectedPackage?: BookingPackage | null;

  /* =====================================================
     STATUS
  ===================================================== */

  status: BookingStatus;

  workerAcceptedAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;

  workerRejectedAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;

  workerMessage?: string | null;

  proposedDate?: string | null;

  proposedStartTime?: string | null;

  proposedEndTime?: string | null;

  customerConfirmedAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;

  confirmedDate?: string | null;

  confirmedStartTime?: string | null;

  confirmedEndTime?: string | null;

  createdAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;

  updatedAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;
};

/* =========================================================
   RESPONSE TYPES
========================================================= */

export type BookingResponse = {
  success: boolean;
  message?: string;
  total?: number;
  data?: Booking;
};

export type BookingListResponse = {
  success: boolean;
  message?: string;
  total?: number;
  data: Booking[];
};

/* =========================================================
   CREATE SERVICE BOOKING
========================================================= */

export async function createBooking(
  data: {
    serviceId: string;

    requestedDate?: string | null;

    customerMessage?: string;

    /**
     * Service address
     */
    address?: string;

    /**
     * Customer city
     */
    city?: string;

    /**
     * Customer phone
     */
    phone?: string;

    /**
     * Booking urgency
     */
    urgency?: "normal" | "urgent";

    /**
     * Selected package
     */
    packageId?:
      | "basic"
      | "standard"
      | "premium";

    packageTitle?: string;

    packagePrice?: number;

    packageDeliveryHours?: number;

    selectedPackage?: {
      id:
        | "basic"
        | "standard"
        | "premium";

      title: string;

      price: number;

      description?: string;

      deliveryHours?: number;
    };
  }
): Promise<BookingResponse> {
  const serviceId = String(
    data?.serviceId || ""
  ).trim();

  if (!serviceId) {
    throw new Error(
      "Service ID is required"
    );
  }

  const response =
    await api.post<BookingResponse>(
      "/bookings",
      {
        ...data,

        serviceId,

        // Make sure city is sent as a clean value
        city:
          typeof data.city === "string"
            ? data.city.trim()
            : undefined,

        // Make sure phone is sent as a clean value
        phone:
          typeof data.phone === "string"
            ? data.phone.trim()
            : undefined,

        // Make sure address is sent as a clean value
        address:
          typeof data.address === "string"
            ? data.address.trim()
            : undefined,
      }
    );

  return response.data;
}

/* =========================================================
   GET CUSTOMER BOOKINGS
========================================================= */

export async function getCustomerBookings(): Promise<BookingListResponse> {
  const response =
    await api.get<BookingListResponse>(
      "/bookings/customer"
    );

  return {
    ...response.data,

    data: Array.isArray(
      response.data?.data
    )
      ? response.data.data
      : [],
  };
}

/* =========================================================
   GET WORKER BOOKINGS
========================================================= */

export async function getWorkerBookings(): Promise<BookingListResponse> {
  const response =
    await api.get<BookingListResponse>(
      "/bookings/worker"
    );

  return {
    ...response.data,

    data: Array.isArray(
      response.data?.data
    )
      ? response.data.data
      : [],
  };
}

/* =========================================================
   GET BOOKING BY ID
========================================================= */

export async function getBookingById(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.get<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}`
    );

  return response.data;
}

/* =========================================================
   WORKER ACCEPT BOOKING
========================================================= */

export async function acceptBooking(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/accept`
    );

  return response.data;
}

/* =========================================================
   WORKER REJECT BOOKING
========================================================= */

export async function rejectBooking(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/reject`
    );

  return response.data;
}

/* =========================================================
   WORKER PROPOSE DATE / TIME
========================================================= */

export async function proposeBookingTime(
  id: string,
  data: {
    date: string;
    startTime: string;
    endTime: string;
    message?: string;
  }
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  if (!data?.date) {
    throw new Error(
      "Date is required"
    );
  }

  if (!data?.startTime) {
    throw new Error(
      "Start time is required"
    );
  }

  if (!data?.endTime) {
    throw new Error(
      "End time is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/propose-time`,
      {
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        message:
          data.message || "",
      }
    );

  return response.data;
}

/* =========================================================
   CUSTOMER CONFIRM BOOKING
========================================================= */

export async function confirmBooking(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/confirm`
    );

  return response.data;
}

/* =========================================================
   WORKER START JOB
========================================================= */

export async function startBooking(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/start`
    );

  return response.data;
}

/* =========================================================
   WORKER COMPLETE JOB
========================================================= */

export async function completeBooking(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/complete`
    );

  return response.data;
}

/* =========================================================
   CUSTOMER CANCEL BOOKING
========================================================= */

export async function cancelBooking(
  id: string
): Promise<BookingResponse> {
  const bookingId = String(
    id || ""
  ).trim();

  if (!bookingId) {
    throw new Error(
      "Booking ID is required"
    );
  }

  const response =
    await api.put<BookingResponse>(
      `/bookings/${encodeURIComponent(
        bookingId
      )}/cancel`
    );

  return response.data;
}