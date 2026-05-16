import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'

export default function KPICard({ title, value, subtext, iconName = 'activity', period }) {
    const icons = {
        dollar: <DollarSign className="w-5 h-5 text-emerald-600" />,
        bag: <ShoppingBag className="w-5 h-5 text-blue-600" />,
        users: <Users className="w-5 h-5 text-purple-600" />,
        activity: <Activity className="w-5 h-5 text-orange-500" />
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-stone-50 rounded-xl">
                    {icons[iconName] || icons.activity}
                </div>
                {period && (
                    <span className="text-[10px] font-medium text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">
                        {period}
                    </span>
                )}
            </div>

            <h3 className="text-stone-500 text-xs font-medium mb-1 uppercase tracking-wide">{title}</h3>
            <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-bold text-stone-800 tracking-tight leading-tight">{value}</span>
                {subtext && <span className="text-xs text-stone-400 font-medium">{subtext}</span>}
            </div>
        </div>
    )
}
