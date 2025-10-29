import { ChevronDown, Plus } from 'lucide-react'
import React, { useState } from 'react'
import Markdown from 'react-markdown'

const CreationItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg'>
      <div className='flex justify-between items-center gap-4'>
        <div>
          <h2>{item.prompt}</h2>
          <p className='text-gray-500'>{item.type} - {new Date(item.created_at).toLocaleDateString()}</p>
        </div>
        <div className='flex items-center gap-2'>
          <button className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full'>{item.type}</button>
          <Plus onClick={() => setExpanded(!expanded)} className={`transition-transform duration-300 text-gray-400 cursor-pointer ${expanded ? 'rotate-135' : ''}`} size={20} />
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[10000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
        {item.type === 'image' ? (
          <div>
            <img src={item.content} alt="image" className='mt-3 w-full max-w-md' />
          </div>
        ) : (
          <div className='mt-3 h-full text-sm text-slate-700'>
            <div className='reset-tw'>
              <Markdown>{item.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreationItem