import TenantListingPage from "../../../../src/ui/tenant/tenant-listing-page";

type TenantListingRouteProps = {
  params: Promise<{ listingId: string }>;
};

export default async function TenantListingRoute({ params }: TenantListingRouteProps) {
  const { listingId } = await params;
  return <TenantListingPage listingId={listingId} />;
}
