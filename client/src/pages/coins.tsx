import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins as CoinsIcon, CreditCard, Gift, TrendingUp, Crown, Sparkles } from "lucide-react";

const COIN_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    coins: 100,
    price: 1.25,
    bonus: 0,
    popular: false,
    icon: "💰",
    description: "Perfect for trying out gifts"
  },
  {
    id: "bronze",
    name: "Bronze Pack",
    coins: 500,
    price: 5.99,
    bonus: 25,
    popular: false,
    icon: "🥉",
    description: "Great for regular gifting"
  },
  {
    id: "silver",
    name: "Silver Pack",
    coins: 1000,
    price: 11.99,
    bonus: 100,
    popular: true,
    icon: "🥈",
    description: "Most popular choice"
  },
  {
    id: "gold",
    name: "Gold Pack",
    coins: 2500,
    price: 24.99,
    bonus: 300,
    popular: false,
    icon: "🥇",
    description: "Best value for money"
  },
  {
    id: "platinum",
    name: "Platinum Pack",
    coins: 5000,
    price: 49.99,
    bonus: 750,
    popular: false,
    icon: "💎",
    description: "For the ultimate supporter"
  },
  {
    id: "diamond",
    name: "Diamond Pack",
    coins: 10000,
    price: 99.99,
    bonus: 2000,
    popular: false,
    icon: "💍",
    description: "Maximum generosity"
  }
];

const RECENT_TRANSACTIONS = [
  { type: "purchase", amount: 100, description: "Starter Pack Purchase", date: "2 hours ago" },
  { type: "gift_sent", amount: -25, description: "Sent Fire emoji", date: "3 hours ago" },
  { type: "gift_received", amount: 10, description: "Received Heart", date: "5 hours ago" },
  { type: "purchase", amount: 500, description: "Bronze Pack Purchase", date: "1 day ago" },
];

export default function Coins() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userCoins = { amount: 0, totalSpent: 0, totalEarned: 0 } } = useQuery({
    queryKey: ["/api/coins/balance"],
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/coins/transactions"],
    enabled: !!user,
  });

  const purchaseCoinsMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const pkg = COIN_PACKAGES.find(p => p.id === packageId);
      if (!pkg) throw new Error("Package not found");

      return apiRequest("/api/coins/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: packageId,
          coinAmount: pkg.coins + pkg.bonus,
          priceUsd: pkg.price.toString(),
        }),
      });
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsProcessing(true);
    purchaseCoinsMutation.mutate(packageId);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Coin Store</h1>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-4 py-2">
              <CoinsIcon className="w-5 h-5" />
              <span className="font-bold text-lg">{formatNumber(userCoins.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CoinsIcon className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold">{formatNumber(userCoins.amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Gift className="w-6 h-6 text-red-500" />
                <span className="text-2xl font-bold">{formatNumber(userCoins.totalSpent)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-2xl font-bold">{formatNumber(userCoins.totalEarned)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coin Packages */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Choose Your Coin Package</h2>
            <p className="text-gray-400">Support your favorite creators with gifts and reactions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COIN_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative bg-gray-900 border-2 transition-all cursor-pointer ${
                  pkg.popular
                    ? "border-pink-500 bg-gradient-to-br from-pink-900/20 to-purple-900/20"
                    : selectedPackage === pkg.id
                    ? "border-blue-500"
                    : "border-gray-800 hover:border-gray-700"
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-pink-500 text-white px-3 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-2">{pkg.icon}</div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <p className="text-sm text-gray-400">{pkg.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <CoinsIcon className="w-6 h-6 text-yellow-500" />
                      <span className="text-3xl font-bold">{formatNumber(pkg.coins)}</span>
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="flex items-center justify-center space-x-1 text-green-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">+{pkg.bonus} Bonus</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold">${pkg.price}</div>
                    <div className="text-xs text-gray-400">
                      ${(pkg.price / (pkg.coins + pkg.bonus) * 100).toFixed(2)} per 100 coins
                    </div>
                  </div>

                  <Button
                    className={`w-full ${
                      pkg.popular
                        ? "bg-pink-500 hover:bg-pink-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(pkg.id);
                    }}
                    disabled={isProcessing && selectedPackage === pkg.id}
                  >
                    {isProcessing && selectedPackage === pkg.id ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                </CardContent>

                {pkg.bonus > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-green-900 text-green-300 text-xs">
                      +{pkg.bonus}
                    </Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Recent Transactions</h3>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              {(transactions.length > 0 ? transactions : RECENT_TRANSACTIONS).map((transaction: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === "purchase" ? "bg-green-900 text-green-400" :
                      transaction.type === "gift_sent" ? "bg-red-900 text-red-400" :
                      "bg-blue-900 text-blue-400"
                    }`}>
                      {transaction.type === "purchase" ? (
                        <CreditCard className="w-5 h-5" />
                      ) : transaction.type === "gift_sent" ? (
                        <Gift className="w-5 h-5" />
                      ) : (
                        <CoinsIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-400">{transaction.date || transaction.createdAt}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.amount > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">How Coins Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CoinsIcon className="w-6 h-6 text-black" />
                </div>
                <h4 className="font-semibold mb-2">Purchase Coins</h4>
                <p className="text-sm text-gray-400">Buy coin packages to support your favorite creators</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Send Gifts</h4>
                <p className="text-sm text-gray-400">Use coins to send animated gifts during live streams</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Earn Rewards</h4>
                <p className="text-sm text-gray-400">Creators earn coins from gifts and can convert to real money</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}